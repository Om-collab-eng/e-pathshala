/**
 * Librika Live Collaborative In-Meeting Socket Engine
 * Real-time audio/video is handled securely by JaaS (8x8.vc).
 * This socket engine powers collaborative features: Live In-Class Chat,
 * Multi-user Whiteboard synchronization, Hand-Raising, and Host Lobby Approvals.
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
    });

    // 2. Real-Time Media Signaling: Delegated to JaaS (8x8.vc)
    // Custom peer-to-peer WebRTC is bypassed in favor of JaaS high-definition SFU infrastructure.
    socket.on('signal-offer', () => {});
    socket.on('signal-answer', () => {});
    socket.on('ice-candidate', () => {});

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

    // 9. Multi-Device User Notification Channel Registration (Phone, Laptop, Tablet)
    socket.on('register-user-notifications', ({ userId, schoolCode }) => {
      if (userId) {
        const userRoom = `user_${userId}`;
        socket.join(userRoom);
        if (schoolCode && schoolCode !== 'GLOBAL') {
          socket.join(`school_${schoolCode}`);
        }
        socket.emit('notifications-registered', { status: 'connected', userRoom });
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

/**
 * Emit real-time notification to user across all their connected devices (phone, laptop, etc.)
 */
function emitLiveNotification(io, { userId, schoolCode, title, message, type = 'info', url = '/student', data = {} }) {
  if (!io) return;
  const payload = {
    title: title || 'Librika Alert',
    message: message || '',
    type,
    url,
    data,
    timestamp: Date.now()
  };

  if (userId) {
    io.to(`user_${userId}`).emit('new-notification', payload);
  } else if (schoolCode && schoolCode !== 'GLOBAL') {
    io.to(`school_${schoolCode}`).emit('new-notification', payload);
  } else {
    io.emit('new-notification', payload);
  }
}

module.exports = { initLiveSocket, emitLiveNotification };

