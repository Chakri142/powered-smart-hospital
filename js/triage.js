/* ==========================================================================
   POWERED SMART HOSPITAL (PSH) - TRIAGE & CLINICAL INTAKE ENGINE
   ========================================================================== */

(function(global) {
  'use strict';

  var TriageEngine = {
    recordTriage: function(data) {
      var records = global.StorageEngine.getItem('triageRecords', []);

      var newRecord = {
        triageId: 'tri_' + Date.now(),
        patientId: data.patientId || 'PID-2026-1001',
        bp: data.bp || '120/80',
        pulse: data.pulse || '76 bpm',
        spO2: data.spO2 || '98%',
        temp: data.temp || '98.6°F',
        severity: data.severity || 'STANDARD', // RESUSCITATION, EMERGENCY, URGENT, STANDARD
        authorizedPriority: data.authorizedPriority || 'STANDARD', // EMERGENCY, PRIORITY_ASSIST, STANDARD
        triageBay: data.triageBay || 'Bay Alpha',
        assessedBy: data.assessedBy || 'Triage Nurse',
        timestamp: new Date().toISOString()
      };

      records.push(newRecord);
      global.StorageEngine.setItem('triageRecords', records);

      // If active token exists, update queue priority flag
      if (global.QueueEngine) {
        global.QueueEngine.updateTokenPriority(data.patientId, newRecord.authorizedPriority, newRecord.assessedBy);
      }

      if (global.NotificationsEngine) {
        global.NotificationsEngine.add('System', 'SYS', 'Triage Telemetry Recorded', 'Vitals logged for ' + newRecord.patientId + '. Priority: ' + newRecord.authorizedPriority, 'info');
      }

      if (global.AuditEngine) {
        global.AuditEngine.log('TRIAGE_RECORDED', 'Triage assessed for ' + data.patientId + '. Severity: ' + newRecord.severity + ', Authorized Priority: ' + newRecord.authorizedPriority, 'TRIAGE');
      }

      return newRecord;
    },

    getPatientTriageHistory: function(patientId) {
      var records = global.StorageEngine.getItem('triageRecords', []);
      return records.filter(function(r) { return r.patientId === patientId; });
    }
  };

  global.TriageEngine = TriageEngine;

})(typeof window !== 'undefined' ? window : this);
