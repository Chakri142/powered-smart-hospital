/* ==========================================================================
   POWERED SMART HOSPITAL (PSH) - NOTIFICATIONS & VOICE ANNOUNCER ENGINE
   ========================================================================== */

(function(global) {
  'use strict';

  var NotificationsEngine = {
    showToast: function(title, message, type) {
      type = type || 'info';
      var container = document.getElementById('toast-container');
      if (!container) return;

      var toast = document.createElement('div');
      toast.className = 'toast toast-' + type;

      var borderColors = {
        success: 'var(--accent-green)',
        warning: 'var(--accent-orange)',
        danger: 'var(--accent-red)',
        info: 'var(--accent-blue)'
      };
      toast.style.borderLeftColor = borderColors[type] || 'var(--accent-blue)';

      toast.innerHTML = '<div><strong style="color:#0f172a; display:block; margin-bottom:2px;">' + title + '</strong><span style="color:#475569; font-size:0.9rem;">' + message + '</span></div>';
      container.appendChild(toast);

      this.playChime();

      setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 4500);
    },

    add: function(recipientRole, recipientId, title, message, type) {
      type = type || 'info';
      if (global.StorageEngine) {
        var notifications = global.StorageEngine.getItem('notifications', []);
        var newNotif = {
          notificationId: 'notif_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          recipientRole: recipientRole || 'All',
          recipientId: recipientId || 'ALL',
          title: title,
          message: message,
          type: type,
          isRead: false,
          timestamp: new Date().toISOString()
        };
        notifications.unshift(newNotif);
        if (notifications.length > 100) notifications.pop();
        global.StorageEngine.setItem('notifications', notifications);
      }
      this.showToast(title, message, type);
    },

    announceTokenCall: function(token, roomId) {
      this.playChime();
      var roomClean = (roomId || '').replace('rm_', '');
      var text = 'Attention please. Token ' + token + ', please proceed to Room ' + roomClean + '.';

      this.showToast('📢 Now Serving: ' + token, 'Proceed to Room ' + roomClean, 'warning');

      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          var utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.log('Speech synthesis unavailable or blocked:', e);
        }
      }
    },

    playChime: function() {
      try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        var ctx = new AudioCtx();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch (e) {
        console.log('Audio chime prevented by browser autoplay policy.');
      }
    }
  };

  // POPUP MODAL ENGINE
  var ModalEngine = {
    modalOverlay: null,

    init: function() {
      if (document.getElementById('modal-overlay-3d-root')) return;

      var root = document.createElement('div');
      root.id = 'modal-overlay-3d-root';
      root.className = 'modal-overlay-3d';
      root.innerHTML = '<div class="modal-card-3d">' +
        '<div class="modal-3d-header">' +
          '<div id="modal-3d-icon" class="modal-3d-icon">⚡</div>' +
          '<div id="modal-3d-title" class="modal-3d-title">Notification</div>' +
        '</div>' +
        '<div id="modal-3d-body" class="modal-3d-body">Content details...</div>' +
        '<div id="modal-3d-actions" class="modal-3d-actions"></div>' +
      '</div>';

      document.body.appendChild(root);
      this.modalOverlay = root;
    },

    showModal: function(options) {
      this.init();
      options = options || {};

      var iconEl = document.getElementById('modal-3d-icon');
      var titleEl = document.getElementById('modal-3d-title');
      var bodyEl = document.getElementById('modal-3d-body');
      var actionsEl = document.getElementById('modal-3d-actions');

      var icons = {
        success: '⚡',
        info: 'ℹ',
        warning: '⚠',
        danger: '🛑',
        auth: '🔑',
        hospital: '🏥'
      };

      if (iconEl) iconEl.textContent = options.icon || icons[options.type] || '⚡';
      if (titleEl) titleEl.textContent = options.title || 'PSH Command System';
      if (bodyEl) bodyEl.textContent = options.message || '';

      var self = this;
      if (actionsEl) {
        actionsEl.innerHTML = '';

        if (options.isConfirm) {
          var cancelBtn = document.createElement('button');
          cancelBtn.className = 'btn btn-secondary btn-sm';
          cancelBtn.textContent = options.cancelText || 'Cancel';
          cancelBtn.onclick = function() {
            self.hideModal();
            if (options.onCancel) options.onCancel();
          };
          actionsEl.appendChild(cancelBtn);
        }

        var confirmBtn = document.createElement('button');
        var btnClasses = {
          success: 'btn-success',
          danger: 'btn-danger',
          warning: 'btn-warning',
          info: 'btn-glow'
        };
        confirmBtn.className = 'btn ' + (btnClasses[options.type] || 'btn-glow');
        confirmBtn.textContent = options.confirmText || 'Acknowledge';
        confirmBtn.onclick = function() {
          self.hideModal();
          if (options.onConfirm) options.onConfirm();
        };
        actionsEl.appendChild(confirmBtn);
      }

      if (this.modalOverlay) {
        this.modalOverlay.classList.add('active');
        if (global.NotificationsEngine) global.NotificationsEngine.playChime();
      }
    },

    alert: function(title, message, type, onConfirm) {
      this.showModal({
        title: title,
        message: message,
        type: type || 'info',
        isConfirm: false,
        confirmText: 'OK',
        onConfirm: onConfirm
      });
    },

    confirm: function(title, message, onConfirm, onCancel) {
      this.showModal({
        title: title,
        message: message,
        type: 'warning',
        isConfirm: true,
        confirmText: 'Proceed',
        cancelText: 'Cancel',
        onConfirm: onConfirm,
        onCancel: onCancel
      });
    },

    hideModal: function() {
      if (this.modalOverlay) {
        this.modalOverlay.classList.remove('active');
      }
    }
  };

  global.NotificationsEngine = NotificationsEngine;
  global.ModalEngine = ModalEngine;

})(typeof window !== 'undefined' ? window : this);
