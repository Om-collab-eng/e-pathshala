/**
 * Librika Live Video Classroom & Interactive Whiteboard Engine
 * Multi-speaker WebRTC Conference, Collaborative Drawing Canvas, Chat & Attendance
 */

(function () {
  'use strict';

  window.LibrikaClassroom = {
    api: null,
    whiteboardActive: false,
    canvas: null,
    ctx: null,
    isDrawing: false,
    drawColor: '#0056D2',
    lineWidth: 3,
    tool: 'pen',
    handRaised: false,

    init: function (config) {
      this.config = config || {};
      this.initJitsi();
      this.initWhiteboard();
      this.initControls();
      this.initChat();
      this.initTimer();
    },

    // ─────────────────────────────────────────────────────────────
    // 1. JITSI WEBRTC VIDEO CONFERENCING
    // ─────────────────────────────────────────────────────────────
    initJitsi: function () {
      const container = document.getElementById('jitsiContainer');
      if (!container) return;

      const domain = 'meet.jit.si';
      const cleanRoomName = 'Librika_' + (this.config.meetingId || 'DEMO_ROOM').replace(/[^a-zA-Z0-9]/g, '_');

      const options = {
        roomName: cleanRoomName,
        width: '100%',
        height: '100%',
        parentNode: container,
        userInfo: {
          displayName: this.config.userName || 'Participant',
          email: this.config.userEmail || 'student@librika.in'
        },
        configOverwrite: {
          startWithAudioMuted: !this.config.isHost,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          toolbarButtons: [
            'camera',
            'chat',
            'closedcaptions',
            'desktop',
            'download',
            'embedmeeting',
            'etherpad',
            'feedback',
            'filmstrip',
            'fullscreen',
            'hangup',
            'help',
            'highlight',
            'invite',
            'linktosalesforce',
            'livestreaming',
            'microphone',
            'noisesuppression',
            'participants-pane',
            'profile',
            'raisehand',
            'recording',
            'security',
            'select-background',
            'settings',
            'shareaudio',
            'sharedvideo',
            'shortcuts',
            'stats',
            'tileview',
            'toggle-camera',
            'videoquality',
            'whiteboard'
          ]
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#0A0F1D',
          APP_NAME: 'Librika Live Classroom'
        }
      };

      if (window.JitsiMeetExternalAPI) {
        try {
          this.api = new window.JitsiMeetExternalAPI(domain, options);
          
          this.api.addEventListener('videoConferenceJoined', (e) => {
            console.log('[CLASSROOM] Joined video conference:', e);
          });

          this.api.addEventListener('participantJoined', (p) => {
            this.appendChatMessage('System', `${p.displayName || 'A student'} joined the live class.`);
          });

          this.api.addEventListener('raiseHandUpdated', (e) => {
            if (e.handRaised) {
              this.showToast(`✋ Participant raised hand!`);
            }
          });
        } catch (err) {
          console.error('[CLASSROOM] Jitsi init error:', err);
        }
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 2. INTERACTIVE DRAWING WHITEBOARD
    // ─────────────────────────────────────────────────────────────
    initWhiteboard: function () {
      this.canvas = document.getElementById('whiteboardCanvas');
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();

      window.addEventListener('resize', () => this.resizeCanvas());

      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      };

      const startDrawing = (e) => {
        this.isDrawing = true;
        const pos = getPos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
      };

      const draw = (e) => {
        if (!this.isDrawing) return;
        const pos = getPos(e);
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (this.tool === 'eraser') {
          this.ctx.strokeStyle = '#FFFFFF';
          this.ctx.lineWidth = 20;
        } else {
          this.ctx.strokeStyle = this.drawColor;
        }

        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
      };

      const stopDrawing = () => {
        if (this.isDrawing) {
          this.ctx.closePath();
          this.isDrawing = false;
        }
      };

      this.canvas.addEventListener('mousedown', startDrawing);
      this.canvas.addEventListener('mousemove', draw);
      this.canvas.addEventListener('mouseup', stopDrawing);
      this.canvas.addEventListener('mouseleave', stopDrawing);

      this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e); }, { passive: false });
      this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, { passive: false });
      this.canvas.addEventListener('touchend', stopDrawing);
    },

    resizeCanvas: function () {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const tempImage = this.ctx ? this.canvas.toDataURL() : null;

      this.canvas.width = rect.width;
      this.canvas.height = rect.height - 52;

      if (tempImage) {
        const img = new Image();
        img.src = tempImage;
        img.onload = () => this.ctx.drawImage(img, 0, 0);
      }
    },

    setTool: function (toolName) {
      this.tool = toolName;
      document.querySelectorAll('.ls-wb-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById(`wb_${toolName}`);
      if (activeBtn) activeBtn.classList.add('active');
    },

    setColor: function (hexColor) {
      this.drawColor = hexColor;
      this.setTool('pen');
    },

    clearWhiteboard: function () {
      if (!this.ctx || !this.canvas) return;
      if (confirm('Clear the entire whiteboard canvas?')) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    },

    saveWhiteboardPNG: function () {
      if (!this.canvas) return;
      const link = document.createElement('a');
      link.download = `librika-whiteboard-${Date.now()}.png`;
      link.href = this.canvas.toDataURL('image/png');
      link.click();
    },

    toggleWhiteboard: function () {
      const overlay = document.getElementById('whiteboardOverlay');
      const btn = document.getElementById('dockWhiteboardBtn');
      if (!overlay) return;

      this.whiteboardActive = !this.whiteboardActive;
      if (this.whiteboardActive) {
        overlay.classList.add('active');
        if (btn) btn.classList.add('active');
        this.resizeCanvas();
      } else {
        overlay.classList.remove('active');
        if (btn) btn.classList.remove('active');
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 3. MEETING CONTROLS & DOCK
    // ─────────────────────────────────────────────────────────────
    initControls: function () {
      // Toggle Chat Drawer
      const chatBtn = document.getElementById('dockChatBtn');
      const sidePanel = document.getElementById('sidePanel');
      if (chatBtn && sidePanel) {
        chatBtn.addEventListener('click', () => {
          sidePanel.classList.toggle('collapsed');
          chatBtn.classList.toggle('active');
        });
      }

      // Toggle Whiteboard
      const wbBtn = document.getElementById('dockWhiteboardBtn');
      if (wbBtn) {
        wbBtn.addEventListener('click', () => this.toggleWhiteboard());
      }

      // Raise Hand
      const handBtn = document.getElementById('dockHandBtn');
      if (handBtn) {
        handBtn.addEventListener('click', () => {
          this.handRaised = !this.handRaised;
          handBtn.classList.toggle('active', this.handRaised);
          if (this.api) this.api.executeCommand('toggleRaiseHand');
          this.showToast(this.handRaised ? '✋ Hand raised for the instructor' : 'Hand lowered');
        });
      }

      // Share Link Copy
      const copyBtn = document.getElementById('copyInviteBtn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          const url = window.location.origin + '/live/' + (this.config.meetingId || '');
          navigator.clipboard.writeText(url).then(() => {
            this.showToast('📋 Shareable Live Class Link copied to clipboard!');
          });
        });
      }

      // End / Leave Class
      const leaveBtn = document.getElementById('dockLeaveBtn');
      if (leaveBtn) {
        leaveBtn.addEventListener('click', () => {
          if (confirm('Leave this live classroom?')) {
            if (this.api) this.api.dispose();
            window.location.href = this.config.isHost ? '/studio' : '/student';
          }
        });
      }
    },

    // ─────────────────────────────────────────────────────────────
    // 4. IN-CLASS CHAT
    // ─────────────────────────────────────────────────────────────
    initChat: function () {
      const form = document.getElementById('inClassChatForm');
      const input = document.getElementById('inClassChatInput');
      if (!form || !input) return;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = input.value.trim();
        if (!msg) return;

        this.appendChatMessage(this.config.userName || 'You', msg);
        input.value = '';
      });
    },

    appendChatMessage: function (sender, text) {
      const chatBody = document.getElementById('inClassChatBody');
      if (!chatBody) return;

      const div = document.createElement('div');
      div.className = 'ls-chat-msg';
      div.innerHTML = `<div class="ls-chat-sender">${sender}</div><div class="ls-chat-text">${text}</div>`;
      chatBody.appendChild(div);
      chatBody.scrollTop = chatBody.scrollHeight;
    },

    // ─────────────────────────────────────────────────────────────
    // 5. LIVE RECORDING TIMER
    // ─────────────────────────────────────────────────────────────
    initTimer: function () {
      const timerEl = document.getElementById('liveTimerDisplay');
      if (!timerEl) return;

      let seconds = 0;
      setInterval(() => {
        seconds++;
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        timerEl.textContent = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }, 1000);
    },

    showToast: function (msg) {
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '90px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.background = '#0056D2';
      toast.style.color = '#FFFFFF';
      toast.style.padding = '10px 20px';
      toast.style.borderRadius = '9999px';
      toast.style.fontWeight = '600';
      toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
      toast.style.zIndex = '100000';
      toast.style.animation = 'fadeIn 0.2s ease';
      toast.textContent = msg;

      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  };
})();
