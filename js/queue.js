/* ==========================================================================
   POWERED SMART HOSPITAL (PSH) - QUEUE & TOKEN ENGINE
   ========================================================================== */

(function(global) {
  'use strict';

  var QueueEngine = {
    // Generate Token (e.g. CARD-001)
    issueToken: function(appointment) {
      var queueEntries = global.StorageEngine.getItem('queueEntries', []);
      var departments = global.StorageEngine.getItem('departments', []);

      var dept = departments.find(function(d) { return d.departmentId === appointment.departmentId; }) || { code: 'GEN' };

      // Calculate next sequence number for this department today
      var todayStr = new Date().toISOString().split('T')[0];
      var deptTokensToday = queueEntries.filter(function(q) {
        return q.departmentId === appointment.departmentId && q.admittedAt && q.admittedAt.indexOf(todayStr) === 0;
      });

      var seq = deptTokensToday.length + 1;
      var tokenStr = dept.code + '-' + String(seq).padStart(3, '0');

      var newEntry = {
        queueEntryId: 'qe_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        token: tokenStr,
        appointmentId: appointment.appointmentId || 'apt_walkin',
        patientId: appointment.patientId,
        departmentId: appointment.departmentId,
        doctorId: appointment.doctorId || 'doc_1',
        roomId: appointment.roomId || 'rm_304',
        priority: 'STANDARD', // STANDARD, PRIORITY_ASSIST, EMERGENCY
        priorityAuthorizedBy: 'System',
        state: 'WAITING', // WAITING, CALLED, IN_CONSULTATION, COMPLETED, NO_SHOW, CANCELLED
        admittedAt: new Date().toISOString(),
        calledAt: null,
        completedAt: null
      };

      queueEntries.push(newEntry);
      global.StorageEngine.setItem('queueEntries', queueEntries);

      if (global.AuditEngine) {
        global.AuditEngine.log('TOKEN_ISSUED', 'Issued token ' + tokenStr + ' for patient ' + appointment.patientId, 'QUEUE');
      }

      return newEntry;
    },

    // Issue Manual Walk-In OPD Token
    issueWalkInToken: function(deptId, patientId) {
      var targetDept = deptId || 'dept_genm';
      var doctors = global.StorageEngine ? global.StorageEngine.getItem('doctors', []) : [];
      var deptDoc = doctors.find(function(d) { return d.departmentId === targetDept; }) || doctors[0];

      return this.issueToken({
        appointmentId: 'apt_walkin_' + Date.now(),
        patientId: patientId || 'PID-2026-WALKIN',
        departmentId: targetDept,
        doctorId: deptDoc ? deptDoc.doctorId : 'doc_1',
        roomId: deptDoc ? (deptDoc.roomId || 'rm_101') : 'rm_101'
      });
    },

    // Priority Queue Sorting Engine
    getSortedQueue: function(departmentId, doctorId) {
      var queueEntries = global.StorageEngine.getItem('queueEntries', []);

      var filtered = queueEntries.filter(function(q) {
        var matchDept = !departmentId || q.departmentId === departmentId;
        var matchDoc = !doctorId || q.doctorId === doctorId;
        return matchDept && matchDoc;
      });

      var priorityRank = {
        'EMERGENCY': 1,
        'PRIORITY_ASSIST': 2,
        'STANDARD': 3
      };

      filtered.sort(function(a, b) {
        var rankA = priorityRank[a.priority] || 3;
        var rankB = priorityRank[b.priority] || 3;

        if (rankA !== rankB) return rankA - rankB;
        return new Date(a.admittedAt) - new Date(b.admittedAt);
      });

      return filtered;
    },

    // Doctor Calls Next Token
    callNextToken: function(doctorId) {
      var queueEntries = global.StorageEngine.getItem('queueEntries', []);
      var doctors = global.StorageEngine.getItem('doctors', []);
      var doc = doctors.find(function(d) { return d.doctorId === doctorId; });
      var roomId = doc ? doc.roomId : 'rm_304';

      // Complete active token if any
      var active = queueEntries.find(function(q) {
        return q.doctorId === doctorId && (q.state === 'CALLED' || q.state === 'IN_CONSULTATION');
      });

      if (active) {
        active.state = 'COMPLETED';
        active.completedAt = new Date().toISOString();
      }

      // Get next waiting token sorted by priority
      var waitingQueue = this.getSortedQueue(null, doctorId).filter(function(q) {
        return q.state === 'WAITING';
      });

      if (waitingQueue.length === 0) {
        global.StorageEngine.setItem('queueEntries', queueEntries);
        return { success: false, message: 'No waiting patients in queue for your room.' };
      }

      var nextToken = waitingQueue[0];
      var entryInStore = queueEntries.find(function(q) { return q.queueEntryId === nextToken.queueEntryId; });

      if (entryInStore) {
        entryInStore.state = 'CALLED';
        entryInStore.calledAt = new Date().toISOString();
        entryInStore.roomId = roomId;
      }

      global.StorageEngine.setItem('queueEntries', queueEntries);

      // Trigger Web Audio Chime + Web Speech API voice call announcement
      if (global.NotificationsEngine) {
        global.NotificationsEngine.announceTokenCall(entryInStore.token, roomId);
      }

      if (global.AuditEngine) {
        global.AuditEngine.log('TOKEN_CALLED', 'Doctor ' + doctorId + ' called Token ' + entryInStore.token + ' to Room ' + roomId, 'QUEUE');
      }

      return { success: true, token: entryInStore };
    },

    // Update Priority (Triage Nurse Power)
    updateTokenPriority: function(patientId, priority, authorizedBy) {
      var queueEntries = global.StorageEngine.getItem('queueEntries', []);
      var entry = queueEntries.find(function(q) {
        return q.patientId === patientId && (q.state === 'WAITING' || q.state === 'CALLED');
      });

      if (entry) {
        entry.priority = priority;
        entry.priorityAuthorizedBy = authorizedBy || 'Triage Nurse';
        global.StorageEngine.setItem('queueEntries', queueEntries);

        if (global.AuditEngine) {
          global.AuditEngine.log('TOKEN_PRIORITY_UPDATED', 'Token ' + entry.token + ' priority updated to ' + priority + ' by ' + entry.priorityAuthorizedBy, 'QUEUE');
        }
      }
    },

    // Calculate Estimated Wait Time (mins)
    calculateWaitTime: function(queueEntryId) {
      var queueEntries = global.StorageEngine.getItem('queueEntries', []);
      var target = queueEntries.find(function(q) { return q.queueEntryId === queueEntryId; });
      if (!target || target.state !== 'WAITING') return 0;

      var sorted = this.getSortedQueue(target.departmentId, target.doctorId);
      var posAhead = 0;

      for (var i = 0; i < sorted.length; i++) {
        if (sorted[i].queueEntryId === target.queueEntryId) break;
        if (sorted[i].state === 'WAITING' || sorted[i].state === 'CALLED') posAhead++;
      }

      var doctors = global.StorageEngine.getItem('doctors', []);
      var doc = doctors.find(function(d) { return d.doctorId === target.doctorId; });
      var avgConsultMins = doc ? doc.avgConsultMins : 15;

      return Math.max(0, posAhead * avgConsultMins);
    }
  };

  global.QueueEngine = QueueEngine;

})(typeof window !== 'undefined' ? window : this);
