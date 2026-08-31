/* ==========================================================================
   POWERED SMART HOSPITAL (PSH) - IMMUTABLE AUDIT ENGINE
   ========================================================================== */

(function(global) {
  'use strict';

  var AuditEngine = {
    log: function(actionType, details, targetEntity) {
      if (!global.StorageEngine) return;

      var currentRole = global.AuthEngine ? global.AuthEngine.getCurrentRole() : 'System';
      var currentActor = global.AuthEngine ? global.AuthEngine.getCurrentUserIdentifier() : 'Actor_' + currentRole;

      var logs = global.StorageEngine.getItem('auditLogs', []);
      var newEntry = {
        eventId: 'aud_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        actorRole: currentRole,
        actorId: currentActor,
        actionType: actionType,
        targetEntity: targetEntity || 'SYSTEM',
        details: details || ''
      };

      logs.unshift(newEntry);
      // Keep last 250 logs
      if (logs.length > 250) logs.pop();

      global.StorageEngine.setItem('auditLogs', logs);
    },

    getLogs: function() {
      return global.StorageEngine ? global.StorageEngine.getItem('auditLogs', []) : [];
    }
  };

  global.AuditEngine = AuditEngine;

})(typeof window !== 'undefined' ? window : this);
