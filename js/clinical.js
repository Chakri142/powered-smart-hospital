/* ==========================================================================
   POWERED SMART HOSPITAL (PSH) - CLINICAL RECORDS ENGINE
   ========================================================================== */

(function(global) {
  'use strict';

  var ClinicalEngine = {
    saveConsultationRecord: function(data) {
      var records = global.StorageEngine.getItem('clinicalRecords', []);

      var newRecord = {
        consultationId: 'con_' + Date.now(),
        appointmentId: data.appointmentId,
        queueEntryId: data.queueEntryId,
        doctorId: data.doctorId,
        patientId: data.patientId,
        chiefComplaint: data.chiefComplaint || 'General OPD Evaluation',
        vitals: data.vitals || 'BP 120/80, Pulse 76, SpO2 98%',
        diagnosis: data.diagnosis || 'Clean health evaluation',
        prescriptions: data.prescriptions || ['Multi-vitamin 1 tablet daily'],
        testsOrdered: data.testsOrdered || [],
        followUpDate: data.followUpDate || 'None',
        completedAt: new Date().toISOString()
      };

      records.push(newRecord);
      global.StorageEngine.setItem('clinicalRecords', records);

      // Update Queue Token state to COMPLETED
      var queueEntries = global.StorageEngine.getItem('queueEntries', []);
      var qe = queueEntries.find(function(q) { return q.queueEntryId === data.queueEntryId; });
      if (qe) {
        qe.state = 'COMPLETED';
        qe.completedAt = new Date().toISOString();
        global.StorageEngine.setItem('queueEntries', queueEntries);
      }

      // Update Appointment state to COMPLETED
      var appointments = global.StorageEngine.getItem('appointments', []);
      var apt = appointments.find(function(a) { return a.appointmentId === data.appointmentId; });
      if (apt) {
        apt.status = 'COMPLETED';
        global.StorageEngine.setItem('appointments', appointments);
      }

      if (global.NotificationsEngine) {
        global.NotificationsEngine.add('Patient', data.patientId, 'Consultation Complete', 'Your consultation record and prescriptions are available in your portal wallet.', 'success');
      }

      if (global.AuditEngine) {
        global.AuditEngine.log('CONSULTATION_COMPLETED', 'Consultation ' + newRecord.consultationId + ' completed for patient ' + data.patientId, 'CLINICAL');
      }

      return newRecord;
    },

    getPatientRecords: function(patientId) {
      var records = global.StorageEngine.getItem('clinicalRecords', []);
      return records.filter(function(r) { return r.patientId === patientId; });
    }
  };

  global.ClinicalEngine = ClinicalEngine;

})(typeof window !== 'undefined' ? window : this);
