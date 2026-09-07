/**
 * Librika Live WebRTC Signaling & Collaborative Classroom Socket Engine
 * Pure Native Meeting Software - No third-party Jitsi dependencies
 */

const { Server } = require('socket.io');

function initLiveSocket(httpServer, db) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Active rooms state in memory: meetingId -> Map(socketId -> { userId, userName, role, isMuted, isVideoOff, handRaised, isScreenSharing })
  const rooms = new Map();
  // Active whiteboard history in memory: meetingId -> Array of draw strokes
  const whiteboardHistory = new Map();

  io.on('connection', (socket) => {
    let currentMeetingId = null;
    let currentUserData = null;

    // 1. Join Room
    socket.on('join-room', async ({ meetingId, userId, userName, role, avatar }) => {
      currentMeetingId = meetingId;
      currentUserData = {
        socketId: socket.id,
        userId: userId || `guest_${socket.id.substring(0, 5)}`,
        userName: userName || 'Participant',
        role: role || 'student',
        avatar: avatar || null,
        isMuted: false,
        isVideoOff: false,
        handRaised: false,
        isScreenSharing: false,
        joinedAt: new Date()
      };

      socket.join(meetingId);

      if (!rooms.has(meetingId)) {
        rooms.set(meetingId, new Map());
      }
      const roomUsers = rooms.get(meetingId);
      roomUsers.set(socket.id, currentUserData);

      if (!whiteboardHistory.has(meetingId)) {
        whiteboardHistory.set(meetingId, []);
      }

      // Notify other participants in the room
      const existingParticipants = Array.from(roomUsers.values()).filter(u => u.socketId !== socket.id);
      
      // Send existing users list and whiteboard history to the newly joined peer
      socket.emit('room-users', {
        users: existingParticipants,
        self: currentUserData,
        wbHistory: whiteboardHistory.get(meetingId) || []
      });

      // Broadcast new user to everyone else in room
      socket.to(meetingId).emit('user-joined', currentUserData);

      // Track attendance in database if available
      try {
        if (db && userId && !isNaN(parseInt(userId))) {
          const sessRes = await db.query('SELECT id FROM live_sessions WHERE meeting_id = $1', [meetingId]);
          if (sessRes && sessRes.rows && sessRes.rows.length > 0) {
            const sessionId = sessRes.rows[0].id;
            await db.query(
              `INSERT INTO session_attendance (session_id, student_id, joined_at)
               VALUES ($1, $2, NOW())
               ON CONFLICT DO NOTHING`,
              [sessionId, parseInt(userId)]
            ).catch(() => {});
          }
        }
      } catch (err) {
        console.error('Attendance track error:', err.message);
      }
    });

    // 2. WebRTC Peer-to-Peer Signaling
    socket.on('signal-offer', ({ targetSocketId, offer }) => {
      io.to(targetSocketId).emit('signal-offer', {
        callerSocketId: socket.id,
        callerData: currentUserData,
        offer
      });
    });

    socket.on('signal-answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('signal-answer', {
        responderSocketId: socket.id,
        answer
      });
    });

    socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('ice-candidate', {
        fromSocketId: socket.id,
        candidate
      });
    });

    // 3. Media State Updates (Mute / Video Toggle / Screen Sharing)
    socket.on('media-state-change', ({ isMuted, isVideoOff, isScreenSharing }) => {
      if (currentMeetingId && rooms.has(currentMeetingId)) {
        const u = rooms.get(currentMeetingId).get(socket.id);
        if (u) {
          if (typeof isMuted === 'boolean') u.isMuted = isMuted;
          if (typeof isVideoOff === 'boolean') u.isVideoOff = isVideoOff;
          if (typeof isScreenSharing === 'boolean') u.isScreenSharing = isScreenSharing;
          socket.to(currentMeetingId).emit('user-media-state-changed', {
            socketId: socket.id,
            isMuted: u.isMuted,
            isVideoOff: u.isVideoOff,
            isScreenSharing: u.isScreenSharing
          });
        }
      }
    });

    // 4. Hand Raise / Lower
    socket.on('toggle-hand', ({ handRaised }) => {
      if (currentMeetingId && rooms.has(currentMeetingId)) {
        const u = rooms.get(currentMeetingId).get(socket.id);
        if (u) {
          u.handRaised = handRaised;
          io.to(currentMeetingId).emit('user-hand-toggled', {
            socketId: socket.id,
            userName: u.userName,
            handRaised
          });
        }
      }
    });

    // 5. In-Class Live Chat
    socket.on('send-chat', ({ message }) => {
      if (!currentMeetingId || !message || !message.trim()) return;
      const payload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        socketId: socket.id,
        senderName: currentUserData ? currentUserData.userName : 'Anonymous',
        senderRole: currentUserData ? currentUserData.role : 'student',
        text: message.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      io.to(currentMeetingId).emit('receive-chat', payload);
    });

    // 6. Collaborative Whiteboard Real-Time Sync & History
    socket.on('wb-draw', (drawData) => {
      if (currentMeetingId) {
        if (!whiteboardHistory.has(currentMeetingId)) {
          whiteboardHistory.set(currentMeetingId, []);
        }
        const history = whiteboardHistory.get(currentMeetingId);
        history.push(drawData);
        if (history.length > 5000) history.shift(); // keep last 5000 strokes

        socket.to(currentMeetingId).emit('wb-draw', drawData);
      }
    });

    socket.on('wb-clear', () => {
      if (currentMeetingId) {
        whiteboardHistory.set(currentMeetingId, []);
        socket.to(currentMeetingId).emit('wb-clear');
      }
    });

    socket.on('wb-toggle', ({ isOpen }) => {
      if (currentMeetingId) {
        socket.to(currentMeetingId).emit('wb-toggle', {
          isOpen,
          senderName: currentUserData ? currentUserData.userName : 'Host',
          senderRole: currentUserData ? currentUserData.role : 'student'
        });
      }
    });

    // 7. Host Moderation Controls
    socket.on('host-mute-all', () => {
      if (currentUserData && (currentUserData.role === 'host' || currentUserData.role === 'admin' || currentUserData.role === 'teacher')) {
        socket.to(currentMeetingId).emit('force-mute');
      }
    });

    socket.on('host-end-meeting', () => {
      if (currentUserData && (currentUserData.role === 'host' || currentUserData.role === 'admin' || currentUserData.role === 'teacher')) {
        io.to(currentMeetingId).emit('meeting-ended');
      }
    });

    // 8. Disconnect Cleanup
    socket.on('disconnect', () => {
      if (currentMeetingId && rooms.has(currentMeetingId)) {
        const roomUsers = rooms.get(currentMeetingId);
        roomUsers.delete(socket.id);
        if (roomUsers.size === 0) {
          rooms.delete(currentMeetingId);
          whiteboardHistory.delete(currentMeetingId);
        } else {
          socket.to(currentMeetingId).emit('user-left', {
            socketId: socket.id,
            userName: currentUserData ? currentUserData.userName : 'Participant'
          });
        }
      }
    });
  });

  return io;
}

module.exports = { initLiveSocket };
