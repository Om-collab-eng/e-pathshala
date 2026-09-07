/**
 * Librika Meet - Native WebRTC Video Conferencing & Interactive Classroom Engine
 * Pure In-House Architecture - Zero Third-Party Meeting Iframes (No Jitsi)
 */

(function() {
  'use strict';

  // Reliable Public WebRTC STUN & Turn Servers
  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };

  let socket = null;
  let localStream = null;
  let screenStream = null;
  let isMuted = false;
  let isVideoOff = false;
  let isScreenSharing = false;
  let isHandRaised = false;
  let isWhiteboardOpen = false;
  let isChatOpen = true;
  let isParticipantsOpen = false;
  let pinnedSocketId = null;

  // Peer Connections: Map(socketId -> RTCPeerConnection)
  const peerConnections = new Map();
  // Remote Streams: Map(socketId -> MediaStream)
  const remoteStreams = new Map();
  // Pending ICE Candidates: Map(socketId -> Array<RTCIceCandidate>)
  const pendingIceCandidates = new Map();
  // Remote User Meta: Map(socketId -> { userId, userName, role, isMuted, isVideoOff, handRaised, isScreenSharing })
  const participants = new Map();

  // Whiteboard State & History
  let wbCanvas = null;
  let wbCtx = null;
  let isDrawing = false;
  let currentTool = 'pen'; // 'pen' | 'highlighter' | 'eraser'
  let currentColor = '#0056D2';
  let currentLineWidth = 3;
  let lastX = 0;
  let lastY = 0;
  let wbStrokesHistory = [];

  // Session Duration Timer
  let timerInterval = null;
  let sessionSeconds = 0;

  // DOM Elements
  let videoGrid, selfVideo, selfTile, selfAvatar, selfNameBadge, micStatusIcon, camStatusIcon;
  let dockMicBtn, dockCamBtn, dockScreenBtn, dockHandBtn, dockWbBtn, dockChatBtn, dockParticipantsBtn, dockLeaveBtn;
  let sidePanel, chatBody, chatInput, chatForm, participantsListEl, participantCountEl;
  let whiteboardOverlay, timerEl;

  // ─────────────────────────────────────────────────────────────
  // 1. INITIALIZATION & SEQUENCE
  // ─────────────────────────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', async () => {
    cacheElements();
    initTimer();
    initWhiteboard();
    bindDockEvents();
    
    // 1. Capture local audio/video media FIRST so tracks are ready before signaling
    await startLocalMedia();

    // 2. Connect to Socket.IO Signaling Engine
    initSocket();
  });

  function cacheElements() {
    videoGrid = document.getElementById('videoGrid');
    selfVideo = document.getElementById('selfVideo');
    selfTile = document.getElementById('selfTile');
    selfAvatar = document.getElementById('selfAvatar');
    selfNameBadge = document.getElementById('selfNameBadge');
    micStatusIcon = document.getElementById('micStatusIcon');
    camStatusIcon = document.getElementById('camStatusIcon');

    dockMicBtn = document.getElementById('dockMicBtn');
    dockCamBtn = document.getElementById('dockCamBtn');
    dockScreenBtn = document.getElementById('dockScreenBtn');
    dockHandBtn = document.getElementById('dockHandBtn');
    dockWbBtn = document.getElementById('dockWhiteboardBtn');
    dockChatBtn = document.getElementById('dockChatBtn');
    dockParticipantsBtn = document.getElementById('dockParticipantsBtn');
    dockLeaveBtn = document.getElementById('dockLeaveBtn');

    sidePanel = document.getElementById('sidePanel');
    chatBody = document.getElementById('inClassChatBody');
    chatInput = document.getElementById('inClassChatInput');
    chatForm = document.getElementById('inClassChatForm');
    participantsListEl = document.getElementById('participantsList');
    participantCountEl = document.getElementById('participantCountBadge');

    whiteboardOverlay = document.getElementById('whiteboardOverlay');
    timerEl = document.getElementById('liveTimerDisplay');
  }

  function initTimer() {
    timerInterval = setInterval(() => {
      sessionSeconds++;
      const hrs = String(Math.floor(sessionSeconds / 3600)).padStart(2, '0');
      const mins = String(Math.floor((sessionSeconds % 3600) / 60)).padStart(2, '0');
      const secs = String(sessionSeconds % 60).padStart(2, '0');
      if (timerEl) timerEl.textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. LOCAL MEDIA CAPTURE
  // ─────────────────────────────────────────────────────────────
  async function startLocalMedia() {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      if (selfVideo) {
        selfVideo.srcObject = localStream;
        selfVideo.muted = true; // prevent local audio feedback echo
        selfVideo.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Camera/Mic permission not granted or device not available:', err);
      localStream = createPlaceholderMediaStream();
      if (selfVideo) {
        selfVideo.srcObject = localStream;
        selfVideo.muted = true;
      }
      isVideoOff = true;
      isMuted = true;
      updateSelfMediaUI();
    }
  }

  function createPlaceholderMediaStream() {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, 640, 360);
    const videoTrack = canvas.captureStream(10).getVideoTracks()[0];
    
    // Silent WebAudio oscillator track
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const dst = audioCtx.createMediaStreamDestination();
      osc.connect(dst);
      const audioTrack = dst.stream.getAudioTracks()[0];
      audioTrack.enabled = false;
      return new MediaStream([videoTrack, audioTrack]);
    } catch (e) {
      return new MediaStream([videoTrack]);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. SOCKET.IO & WEBRTC SIGNALING
  // ─────────────────────────────────────────────────────────────
  function initSocket() {
    if (typeof io === 'undefined') {
      console.error('Socket.io script not found');
      return;
    }

    socket = io();

    socket.on('connect', () => {
      console.log('Connected to Librika Live Signaling Engine:', socket.id);
      
      const meetingId = window.ROOM_CONFIG.meetingId;
      const userId = window.ROOM_CONFIG.userId;
      const userName = window.ROOM_CONFIG.userName;
      const role = window.ROOM_CONFIG.isHost ? 'host' : 'student';

      socket.emit('join-room', {
        meetingId,
        userId,
        userName,
        role
      });
    });

    // Receive existing participants & whiteboard history
    socket.on('room-users', async ({ users, self, wbHistory }) => {
      console.log('Existing users in room:', users);

      if (wbHistory && Array.isArray(wbHistory)) {
        wbStrokesHistory = wbHistory;
        redrawWhiteboardHistory();
      }

      users.forEach(user => {
        participants.set(user.socketId, user);
        createRemoteVideoTile(user.socketId, user);
        // Call existing peer
        initiatePeerCall(user.socketId);
      });
      updateParticipantsListUI();
    });

    // New participant joined
    socket.on('user-joined', (user) => {
      console.log('New participant joined:', user);
      participants.set(user.socketId, user);
      createRemoteVideoTile(user.socketId, user);
      updateParticipantsListUI();
      showToast(`${user.userName} joined`);
    });

    // Handle incoming WebRTC Offer
    socket.on('signal-offer', async ({ callerSocketId, callerData, offer }) => {
      console.log('Received WebRTC Offer from:', callerSocketId);
      if (callerData) {
        participants.set(callerSocketId, callerData);
        createRemoteVideoTile(callerSocketId, callerData);
        updateParticipantsListUI();
      }

      const pc = getOrCreatePeerConnection(callerSocketId);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        // Drain pending ICE candidates
        await drainPendingCandidates(callerSocketId, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('signal-answer', {
          targetSocketId: callerSocketId,
          answer
        });
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    });

    // Handle incoming WebRTC Answer
    socket.on('signal-answer', async ({ responderSocketId, answer }) => {
      console.log('Received WebRTC Answer from:', responderSocketId);
      const pc = peerConnections.get(responderSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await drainPendingCandidates(responderSocketId, pc);
        } catch (err) {
          console.error('Error handling WebRTC answer:', err);
        }
      }
    });

    // Handle incoming ICE Candidate
    socket.on('ice-candidate', async ({ fromSocketId, candidate }) => {
      if (!candidate) return;
      const pc = peerConnections.get(fromSocketId);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ice candidate:', err);
        }
      } else {
        // Queue until remoteDescription is set
        if (!pendingIceCandidates.has(fromSocketId)) {
          pendingIceCandidates.set(fromSocketId, []);
        }
        pendingIceCandidates.get(fromSocketId).push(candidate);
      }
    });

    // Media State Changed by peer
    socket.on('user-media-state-changed', ({ socketId, isMuted: peerMuted, isVideoOff: peerVideoOff, isScreenSharing: peerScreen }) => {
      const u = participants.get(socketId);
      if (u) {
        u.isMuted = peerMuted;
        u.isVideoOff = peerVideoOff;
        u.isScreenSharing = peerScreen;
        updatePeerTileMediaState(socketId, u);
        updateParticipantsListUI();
      }
    });

    // Hand Raised / Lowered
    socket.on('user-hand-toggled', ({ socketId, userName, handRaised }) => {
      const u = participants.get(socketId);
      if (u) {
        u.handRaised = handRaised;
        updatePeerTileMediaState(socketId, u);
        updateParticipantsListUI();
      }
      if (handRaised) {
        showToast(`✋ ${userName} raised hand`);
      }
    });

    // Live In-Class Chat Message
    socket.on('receive-chat', (msg) => {
      appendChatMessage(msg);
      if (!isChatOpen) {
        const badge = document.getElementById('chatUnreadBadge');
        if (badge) badge.style.display = 'inline-flex';
      }
    });

    // Collaborative Whiteboard Stroke
    socket.on('wb-draw', (data) => {
      wbStrokesHistory.push(data);
      renderStroke(data);
    });

    socket.on('wb-clear', () => {
      wbStrokesHistory = [];
      clearWhiteboardCanvas();
    });

    // Host Force Mute
    socket.on('force-mute', () => {
      if (!window.ROOM_CONFIG.isHost) {
        muteAudio();
        showToast('The host has muted all microphones');
      }
    });

    // Meeting Ended by Host
    socket.on('meeting-ended', () => {
      showToast('The host has ended this live meeting.');
      setTimeout(() => {
        window.location.href = window.ROOM_CONFIG.isHost ? '/studio' : '/student';
      }, 1500);
    });

    // Participant Left
    socket.on('user-left', ({ socketId, userName }) => {
      console.log('User left:', userName);
      cleanupPeer(socketId);
      participants.delete(socketId);
      removeRemoteVideoTile(socketId);
      updateParticipantsListUI();
      showToast(`${userName} left`);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 4. WEBRTC PEER CONNECTION MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  async function initiatePeerCall(targetSocketId) {
    const pc = getOrCreatePeerConnection(targetSocketId);
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);

      socket.emit('signal-offer', {
        targetSocketId,
        offer
      });
    } catch (err) {
      console.error('Error initiating peer call:', err);
    }
  }

  function getOrCreatePeerConnection(targetSocketId) {
    if (peerConnections.has(targetSocketId)) {
      return peerConnections.get(targetSocketId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks (Audio & Video)
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // ICE Candidate Handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    // Remote Track Arrival (Video / Audio stream)
    pc.ontrack = (event) => {
      console.log('Received remote track from:', targetSocketId, event.track.kind);
      let stream = remoteStreams.get(targetSocketId);
      if (!stream) {
        stream = new MediaStream();
        remoteStreams.set(targetSocketId, stream);
      }
      
      stream.addTrack(event.track);

      const remoteVideoEl = document.getElementById(`video_${targetSocketId}`);
      if (remoteVideoEl) {
        remoteVideoEl.srcObject = stream;
        remoteVideoEl.muted = false; // UNMUTED so audio is heard clearly
        remoteVideoEl.play().catch(e => console.warn('Autoplay error:', e));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${targetSocketId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupPeer(targetSocketId);
      }
    };

    peerConnections.set(targetSocketId, pc);
    return pc;
  }

  async function drainPendingCandidates(socketId, pc) {
    const pending = pendingIceCandidates.get(socketId);
    if (pending && pending.length > 0) {
      for (const candidate of pending) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error draining candidate:', e);
        }
      }
      pendingIceCandidates.delete(socketId);
    }
  }

  function cleanupPeer(socketId) {
    const pc = peerConnections.get(socketId);
    if (pc) {
      pc.close();
      peerConnections.delete(socketId);
    }
    remoteStreams.delete(socketId);
    pendingIceCandidates.delete(socketId);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. DOCK MEDIA CONTROLS
  // ─────────────────────────────────────────────────────────────
  function bindDockEvents() {
    if (dockMicBtn) dockMicBtn.addEventListener('click', toggleAudio);
    if (dockCamBtn) dockCamBtn.addEventListener('click', toggleVideo);
    if (dockScreenBtn) dockScreenBtn.addEventListener('click', toggleScreenShare);
    if (dockHandBtn) dockHandBtn.addEventListener('click', toggleHandRaise);
    if (dockWbBtn) dockWbBtn.addEventListener('click', toggleWhiteboard);
    if (dockChatBtn) dockChatBtn.addEventListener('click', toggleChatPanel);
    if (dockParticipantsBtn) dockParticipantsBtn.addEventListener('click', toggleParticipantsPanel);
    if (dockLeaveBtn) dockLeaveBtn.addEventListener('click', leaveMeeting);

    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendChatMessage();
      });
    }

    const copyInviteBtn = document.getElementById('copyInviteBtn');
    if (copyInviteBtn) copyInviteBtn.addEventListener('click', copyMeetingInvite);
  }

  function toggleAudio() {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      isMuted = !isMuted;
      audioTrack.enabled = !isMuted;
      updateSelfMediaUI();
      broadcastMediaState();
    }
  }

  function muteAudio() {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      isMuted = true;
      audioTrack.enabled = false;
      updateSelfMediaUI();
      broadcastMediaState();
    }
  }

  function toggleVideo() {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      isVideoOff = !isVideoOff;
      videoTrack.enabled = !isVideoOff;
      updateSelfMediaUI();
      broadcastMediaState();
    }
  }

  async function toggleScreenShare() {
    if (isScreenSharing) {
      stopScreenSharing();
    } else {
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: true
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Replace video track across all peer connections
        peerConnections.forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        if (selfVideo) {
          selfVideo.srcObject = screenStream;
          selfVideo.play().catch(() => {});
        }

        isScreenSharing = true;
        dockScreenBtn.classList.add('active');
        dockScreenBtn.style.background = '#10B981';
        selfTile.classList.add('screenshare-active');

        screenTrack.onended = () => {
          stopScreenSharing();
        };

        broadcastMediaState();
        showToast('Screen sharing active');
      } catch (err) {
        console.warn('Screen share cancelled:', err);
      }
    }
  }

  function stopScreenSharing() {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      screenStream = null;
    }

    if (localStream) {
      const camTrack = localStream.getVideoTracks()[0];
      peerConnections.forEach((pc) => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender && camTrack) {
          sender.replaceTrack(camTrack);
        }
      });

      if (selfVideo) {
        selfVideo.srcObject = localStream;
        selfVideo.play().catch(() => {});
      }
    }

    isScreenSharing = false;
    dockScreenBtn.classList.remove('active');
    dockScreenBtn.style.background = '';
    selfTile.classList.remove('screenshare-active');
    broadcastMediaState();
    showToast('Screen sharing ended');
  }

  function toggleHandRaise() {
    isHandRaised = !isHandRaised;
    dockHandBtn.classList.toggle('active', isHandRaised);
    
    const selfHandIcon = document.getElementById('selfHandIcon');
    if (selfHandIcon) {
      selfHandIcon.style.display = isHandRaised ? 'inline-flex' : 'none';
    }

    if (socket) {
      socket.emit('toggle-hand', { handRaised: isHandRaised });
    }
    showToast(isHandRaised ? '✋ Hand raised' : 'Hand lowered');
  }

  function broadcastMediaState() {
    if (socket) {
      socket.emit('media-state-change', {
        isMuted,
        isVideoOff,
        isScreenSharing
      });
    }
  }

  function updateSelfMediaUI() {
    if (dockMicBtn) {
      dockMicBtn.classList.toggle('muted', isMuted);
      dockMicBtn.innerHTML = `<span class="material-symbols-outlined">${isMuted ? 'mic_off' : 'mic'}</span>`;
      dockMicBtn.style.background = isMuted ? '#EF4444' : '';
    }

    if (dockCamBtn) {
      dockCamBtn.classList.toggle('muted', isVideoOff);
      dockCamBtn.innerHTML = `<span class="material-symbols-outlined">${isVideoOff ? 'videocam_off' : 'videocam'}</span>`;
      dockCamBtn.style.background = isVideoOff ? '#EF4444' : '';
    }

    if (selfAvatar) {
      selfAvatar.style.display = isVideoOff ? 'flex' : 'none';
    }
    if (micStatusIcon) {
      micStatusIcon.textContent = isMuted ? 'mic_off' : 'mic';
      micStatusIcon.style.color = isMuted ? '#EF4444' : '#10B981';
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. VIDEO TILES & MULTI-CAM GRID
  // ─────────────────────────────────────────────────────────────
  function createRemoteVideoTile(socketId, userData) {
    if (document.getElementById(`tile_${socketId}`)) return;

    const tile = document.createElement('div');
    tile.className = 'ls-video-tile';
    tile.id = `tile_${socketId}`;
    tile.onclick = () => pinTile(socketId);

    const initialLetter = (userData.userName || 'P').charAt(0).toUpperCase();

    tile.innerHTML = `
      <video id="video_${socketId}" class="ls-video-stream" autoplay playsinline></video>
      
      <div id="avatar_${socketId}" class="ls-video-avatar" style="display:${userData.isVideoOff ? 'flex' : 'none'};">
        <span>${initialLetter}</span>
      </div>

      <div class="ls-tile-overlay-top">
        <span id="hand_${socketId}" class="ls-tile-hand" style="display:${userData.handRaised ? 'inline-flex' : 'none'};">✋</span>
        <span class="ls-badge ${userData.role === 'host' ? 'live' : 'scheduled'}" style="font-size:0.68rem;padding:2px 6px;">
          ${userData.role === 'host' ? 'HOST' : 'STUDENT'}
        </span>
      </div>

      <div class="ls-tile-overlay-bottom">
        <span class="ls-tile-name">${escapeHtml(userData.userName)}</span>
        <span id="mic_${socketId}" class="material-symbols-outlined text-[16px]" style="color:${userData.isMuted ? '#EF4444' : '#10B981'};">
          ${userData.isMuted ? 'mic_off' : 'mic'}
        </span>
      </div>
    `;

    videoGrid.appendChild(tile);

    // If stream already exists, attach immediately
    const existingStream = remoteStreams.get(socketId);
    if (existingStream) {
      const v = document.getElementById(`video_${socketId}`);
      if (v) {
        v.srcObject = existingStream;
        v.muted = false;
        v.play().catch(() => {});
      }
    }

    adjustGridLayout();
  }

  function removeRemoteVideoTile(socketId) {
    const tile = document.getElementById(`tile_${socketId}`);
    if (tile) tile.remove();
    if (pinnedSocketId === socketId) {
      pinnedSocketId = null;
      videoGrid.classList.remove('spotlight-layout');
    }
    adjustGridLayout();
  }

  function updatePeerTileMediaState(socketId, u) {
    const avatar = document.getElementById(`avatar_${socketId}`);
    const micIcon = document.getElementById(`mic_${socketId}`);
    const handIcon = document.getElementById(`hand_${socketId}`);

    if (avatar) avatar.style.display = u.isVideoOff ? 'flex' : 'none';
    if (micIcon) {
      micIcon.textContent = u.isMuted ? 'mic_off' : 'mic';
      micIcon.style.color = u.isMuted ? '#EF4444' : '#10B981';
    }
    if (handIcon) {
      handIcon.style.display = u.handRaised ? 'inline-flex' : 'none';
    }
  }

  function pinTile(socketId) {
    if (pinnedSocketId === socketId) {
      pinnedSocketId = null;
      videoGrid.classList.remove('spotlight-layout');
      document.querySelectorAll('.ls-video-tile').forEach(t => t.classList.remove('pinned'));
    } else {
      pinnedSocketId = socketId;
      videoGrid.classList.add('spotlight-layout');
      document.querySelectorAll('.ls-video-tile').forEach(t => t.classList.remove('pinned'));
      const target = socketId === 'self' ? selfTile : document.getElementById(`tile_${socketId}`);
      if (target) target.classList.add('pinned');
    }
  }

  function adjustGridLayout() {
    const totalTiles = videoGrid.children.length;
    if (totalTiles <= 1) {
      videoGrid.style.gridTemplateColumns = '1fr';
    } else if (totalTiles === 2) {
      videoGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else if (totalTiles <= 4) {
      videoGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else if (totalTiles <= 6) {
      videoGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    } else {
      videoGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 7. COLLABORATIVE WHITEBOARD
  // ─────────────────────────────────────────────────────────────
  function initWhiteboard() {
    wbCanvas = document.getElementById('whiteboardCanvas');
    if (!wbCanvas) return;
    wbCtx = wbCanvas.getContext('2d');

    resizeWhiteboard();
    window.addEventListener('resize', resizeWhiteboard);

    // Mouse & Touch drawing listeners
    wbCanvas.addEventListener('mousedown', startDrawing);
    wbCanvas.addEventListener('mousemove', draw);
    wbCanvas.addEventListener('mouseup', stopDrawing);
    wbCanvas.addEventListener('mouseout', stopDrawing);

    wbCanvas.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      wbCanvas.dispatchEvent(mouseEvent);
    });

    wbCanvas.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      wbCanvas.dispatchEvent(mouseEvent);
      e.preventDefault();
    });

    wbCanvas.addEventListener('touchend', () => {
      const mouseEvent = new MouseEvent('mouseup', {});
      wbCanvas.dispatchEvent(mouseEvent);
    });
  }

  function resizeWhiteboard() {
    if (!wbCanvas || !wbCanvas.parentElement) return;
    const rect = wbCanvas.parentElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      wbCanvas.width = rect.width;
      wbCanvas.height = Math.max(300, rect.height - 56);
      redrawWhiteboardHistory();
    }
  }

  function toggleWhiteboard() {
    isWhiteboardOpen = !isWhiteboardOpen;
    if (whiteboardOverlay) {
      whiteboardOverlay.style.display = isWhiteboardOpen ? 'flex' : 'none';
    }
    if (dockWbBtn) {
      dockWbBtn.classList.toggle('active', isWhiteboardOpen);
    }
    if (isWhiteboardOpen) {
      setTimeout(() => {
        resizeWhiteboard();
      }, 50);
    }
  }

  function startDrawing(e) {
    isDrawing = true;
    const rect = wbCanvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  }

  function draw(e) {
    if (!isDrawing || !wbCtx || !wbCanvas) return;
    const rect = wbCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const strokeData = {
      x0: lastX / (wbCanvas.width || 1),
      y0: lastY / (wbCanvas.height || 1),
      x1: x / (wbCanvas.width || 1),
      y1: y / (wbCanvas.height || 1),
      color: currentTool === 'eraser' ? '#FFFFFF' : currentColor,
      width: currentTool === 'eraser' ? 24 : (currentTool === 'highlighter' ? 14 : currentLineWidth),
      tool: currentTool
    };

    wbStrokesHistory.push(strokeData);
    renderStroke(strokeData);

    if (socket) {
      socket.emit('wb-draw', strokeData);
    }

    lastX = x;
    lastY = y;
  }

  function stopDrawing() {
    isDrawing = false;
  }

  function renderStroke(data) {
    if (!wbCtx || !wbCanvas) return;
    const w = wbCanvas.width || 800;
    const h = wbCanvas.height || 600;

    wbCtx.beginPath();
    wbCtx.moveTo(data.x0 * w, data.y0 * h);
    wbCtx.lineTo(data.x1 * w, data.y1 * h);
    wbCtx.strokeStyle = data.color;
    wbCtx.lineWidth = data.width;
    wbCtx.lineCap = 'round';
    wbCtx.lineJoin = 'round';
    if (data.tool === 'highlighter') {
      wbCtx.globalAlpha = 0.35;
    } else {
      wbCtx.globalAlpha = 1.0;
    }
    wbCtx.stroke();
    wbCtx.globalAlpha = 1.0;
  }

  function redrawWhiteboardHistory() {
    clearWhiteboardCanvas();
    if (wbStrokesHistory && wbStrokesHistory.length > 0) {
      wbStrokesHistory.forEach(s => renderStroke(s));
    }
  }

  function clearWhiteboardCanvas() {
    if (!wbCtx || !wbCanvas) return;
    wbCtx.clearRect(0, 0, wbCanvas.width, wbCanvas.height);
  }

  function clearWhiteboard() {
    wbStrokesHistory = [];
    clearWhiteboardCanvas();
    if (socket) {
      socket.emit('wb-clear');
    }
    showToast('Whiteboard cleared');
  }

  function setWhiteboardTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.ls-wb-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`wb_${tool}`);
    if (btn) btn.classList.add('active');
  }

  function setWhiteboardColor(color) {
    currentColor = color;
    currentTool = 'pen';
    setWhiteboardTool('pen');
  }

  function saveWhiteboardPNG() {
    if (!wbCanvas) return;
    const link = document.createElement('a');
    link.download = `Librika-Whiteboard-${Date.now()}.png`;
    link.href = wbCanvas.toDataURL('image/png');
    link.click();
  }

  // ─────────────────────────────────────────────────────────────
  // 8. CHAT & PARTICIPANTS PANEL
  // ─────────────────────────────────────────────────────────────
  function toggleChatPanel() {
    isChatOpen = !isChatOpen;
    sidePanel.style.display = (isChatOpen || isParticipantsOpen) ? 'flex' : 'none';
    dockChatBtn.classList.toggle('active', isChatOpen);

    const chatSection = document.getElementById('chatSection');
    const participantsSection = document.getElementById('participantsSection');
    if (chatSection) chatSection.style.display = isChatOpen ? 'flex' : 'none';
    if (participantsSection && !isParticipantsOpen) participantsSection.style.display = 'none';

    if (isChatOpen) {
      const badge = document.getElementById('chatUnreadBadge');
      if (badge) badge.style.display = 'none';
    }
  }

  function toggleParticipantsPanel() {
    isParticipantsOpen = !isParticipantsOpen;
    sidePanel.style.display = (isChatOpen || isParticipantsOpen) ? 'flex' : 'none';
    dockParticipantsBtn.classList.toggle('active', isParticipantsOpen);

    const chatSection = document.getElementById('chatSection');
    const participantsSection = document.getElementById('participantsSection');
    
    if (participantsSection) participantsSection.style.display = isParticipantsOpen ? 'flex' : 'none';
    if (chatSection && !isChatOpen) chatSection.style.display = 'none';
  }

  function sendChatMessage() {
    if (!chatInput) return;
    const text = chatInput.value.trim();
    if (!text) return;

    if (socket) {
      socket.emit('send-chat', { message: text });
    }
    chatInput.value = '';
  }

  function appendChatMessage(msg) {
    if (!chatBody) return;
    const msgEl = document.createElement('div');
    const isSelf = socket && msg.socketId === socket.id;
    msgEl.className = `ls-chat-msg ${isSelf ? 'self' : ''}`;
    
    msgEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
        <span class="ls-chat-sender" style="color:${msg.senderRole === 'host' ? '#60A5FA' : '#E2E8F0'};font-weight:600;">
          ${escapeHtml(msg.senderName)} ${msg.senderRole === 'host' ? '(Host)' : ''}
        </span>
        <span style="font-size:0.7rem;color:#64748B;">${msg.timestamp}</span>
      </div>
      <div class="ls-chat-text">${escapeHtml(msg.text)}</div>
    `;

    chatBody.appendChild(msgEl);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function updateParticipantsListUI() {
    if (!participantsListEl) return;
    
    const count = participants.size + 1; // +1 for self
    if (participantCountEl) participantCountEl.textContent = count;

    let html = `
      <div class="ls-participant-row self">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="ls-avatar-xs">${(window.ROOM_CONFIG.userName || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-size:0.88rem;font-weight:600;color:#FFFFFF;">${escapeHtml(window.ROOM_CONFIG.userName)} (You)</div>
            <div style="font-size:0.72rem;color:#94A3B8;">${window.ROOM_CONFIG.isHost ? 'Meeting Host' : 'Student'}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="material-symbols-outlined text-[16px]" style="color:${isMuted ? '#EF4444' : '#10B981'};">
            ${isMuted ? 'mic_off' : 'mic'}
          </span>
          <span class="material-symbols-outlined text-[16px]" style="color:${isVideoOff ? '#EF4444' : '#10B981'};">
            ${isVideoOff ? 'videocam_off' : 'videocam'}
          </span>
        </div>
      </div>
    `;

    participants.forEach((u) => {
      html += `
        <div class="ls-participant-row">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="ls-avatar-xs">${(u.userName || 'P').charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-size:0.88rem;font-weight:600;color:#FFFFFF;">${escapeHtml(u.userName)}</div>
              <div style="font-size:0.72rem;color:#94A3B8;">${u.role === 'host' ? 'Host' : 'Participant'}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            ${u.handRaised ? '<span style="font-size:14px;">✋</span>' : ''}
            <span class="material-symbols-outlined text-[16px]" style="color:${u.isMuted ? '#EF4444' : '#10B981'};">
              ${u.isMuted ? 'mic_off' : 'mic'}
            </span>
            <span class="material-symbols-outlined text-[16px]" style="color:${u.isVideoOff ? '#EF4444' : '#10B981'};">
              ${u.isVideoOff ? 'videocam_off' : 'videocam'}
            </span>
          </div>
        </div>
      `;
    });

    participantsListEl.innerHTML = html;
  }

  function hostMuteAll() {
    if (socket && window.ROOM_CONFIG.isHost) {
      socket.emit('host-mute-all');
      showToast('Muted all participants');
    }
  }

  function leaveMeeting() {
    if (window.ROOM_CONFIG.isHost) {
      if (confirm('Are you sure you want to end this meeting for all participants?')) {
        if (socket) socket.emit('host-end-meeting');
        cleanupAndExit();
      }
    } else {
      if (confirm('Leave classroom?')) {
        cleanupAndExit();
      }
    }
  }

  function cleanupAndExit() {
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (screenStream) screenStream.getTracks().forEach(t => t.stop());
    if (socket) socket.disconnect();
    window.location.href = window.ROOM_CONFIG.isHost ? '/studio' : '/student';
  }

  function copyMeetingInvite() {
    const meetingUrl = window.location.href;
    const text = `Join Librika Live Classroom:\nCourse: ${window.ROOM_CONFIG.sessionTitle}\nMeeting ID: ${window.ROOM_CONFIG.meetingId}\nJoin Link: ${meetingUrl}`;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Meeting link copied to clipboard!');
    }).catch(() => {
      prompt('Copy meeting link:', meetingUrl);
    });
  }

  function showToast(msg) {
    let toast = document.getElementById('lsClassroomToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'lsClassroomToast';
      toast.className = 'ls-classroom-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.LibrikaClassroom = {
    setTool: setWhiteboardTool,
    setColor: setWhiteboardColor,
    clearWhiteboard: clearWhiteboard,
    saveWhiteboardPNG: saveWhiteboardPNG,
    toggleWhiteboard: toggleWhiteboard,
    hostMuteAll: hostMuteAll,
    copyInvite: copyMeetingInvite,
    pinTile: pinTile
  };

})();
