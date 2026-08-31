/* ==========================================================================
   POWERED SMART HOSPITAL (PSH) - APPOINTMENTS & SLOT ENGINE
   ========================================================================== */

(function(global) {
  'use strict';

  var AppointmentsEngine = {
    // Generate/Refresh Slots for a Doctor on a Date
    generateDoctorSlots: function(doctorId, dateStr) {
      var doctors = global.StorageEngine.getItem('doctors', []);
      var doc = doctors.find(function(d) { return d.doctorId === doctorId; });
      if (!doc) return [];

      var slots = global.StorageEngine.getItem('slots', []);
      var existingSlots = slots.filter(function(s) { return s.doctorId === doctorId && s.date === dateStr; });
      if (existingSlots.length > 0) return existingSlots;

      var newSlots = [];
      var times = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'];
      times.forEach(function(time, idx) {
        newSlots.push({
          slotId: 'slot_' + doctorId + '_' + dateStr.replace(/-/g, '') + '_' + idx,
          doctorId: doctorId,
          departmentId: doc.departmentId,
          roomId: doc.roomId,
          date: dateStr,
          startTime: time,
          status: 'FREE',
          heldUntil: null
        });
      });

      slots = slots.concat(newSlots);
      global.StorageEngine.setItem('slots', slots);
      return newSlots;
    },

    // Submit Patient Visit Intent
    submitRequest: function(reqData) {
      var requests = global.StorageEngine.getItem('requests', []);
      var newReq = {
        requestId: 'req_' + Date.now(),
        patientId: reqData.patientId || 'PID-2026-1001',
        departmentId: reqData.departmentId,
        doctorId: reqData.doctorId || 'doc_1',
        preferredDate: reqData.preferredDate || new Date().toISOString().split('T')[0],
        preferredPeriod: reqData.preferredPeriod || '09:00 AM',
        visitReason: reqData.visitReason || 'General Consultation',
        status: 'SUBMITTED',
        createdAt: new Date().toISOString()
      };

      requests.unshift(newReq);
      global.StorageEngine.setItem('requests', requests);

      if (global.NotificationsEngine) {
        global.NotificationsEngine.add('Receptionist', 'ALL', 'New Appointment Request', 'Patient ' + newReq.patientId + ' submitted a visit request for ' + newReq.preferredDate, 'info');
      }

      if (global.AuditEngine) {
        global.AuditEngine.log('REQUEST_SUBMITTED', 'Patient ' + newReq.patientId + ' submitted appointment request ' + newReq.requestId, 'REQUEST');
      }

      return { success: true, request: newReq };
    },

    // Receptionist Approve & Slot Allocation
    approveRequest: function(requestId, slotId) {
      var requests = global.StorageEngine.getItem('requests', []);
      var req = requests.find(function(r) { return r.requestId === requestId; });
      if (!req) return { success: false, message: 'Request not found.' };

      var slots = global.StorageEngine.getItem('slots', []);
      var slot = slots.find(function(s) { return s.slotId === slotId; });

      var doctors = global.StorageEngine.getItem('doctors', []);
      var doc = doctors.find(function(d) { return d.doctorId === req.doctorId; }) || doctors[0];

      if (slot) slot.status = 'BOOKED';

      req.status = 'APPROVED';
      global.StorageEngine.setItem('requests', requests);
      global.StorageEngine.setItem('slots', slots);

      // Create Confirmed Appointment with Physical Location Details
      var appointments = global.StorageEngine.getItem('appointments', []);
      var depts = global.StorageEngine.getItem('departments', []);
      var dept = depts.find(function(d) { return d.departmentId === req.departmentId; });

      var newApt = {
        appointmentId: 'apt_' + Date.now(),
        requestId: req.requestId,
        patientId: req.patientId,
        doctorId: doc ? doc.doctorId : 'doc_1',
        departmentId: req.departmentId,
        block: doc ? doc.block : (dept ? dept.block : 'Block A (East Wing)'),
        floor: doc ? doc.floor : (dept ? dept.floor : 'Floor 3'),
        roomId: doc ? doc.roomId : 'rm_304',
        roomName: doc ? doc.roomName : 'Room 304 (Cardiac Suite)',
        date: req.preferredDate,
        startTime: slot ? slot.startTime : '09:00 AM',
        status: 'CONFIRMED',
        createdAt: new Date().toISOString()
      };

      appointments.unshift(newApt);
      global.StorageEngine.setItem('appointments', appointments);

      if (global.NotificationsEngine) {
        global.NotificationsEngine.add('Patient', req.patientId, 'Appointment Approved!', 'Your appointment with ' + (doc ? doc.name : 'Doctor') + ' is confirmed for ' + newApt.date + ' at ' + newApt.startTime, 'success');
      }

      if (global.AuditEngine) {
        global.AuditEngine.log('REQUEST_APPROVED', 'Receptionist approved request ' + requestId + '. Appointment ID: ' + newApt.appointmentId, 'APPOINTMENT');
      }

      return { success: true, appointment: newApt };
    },

    // Patient Check-in Workflow
    verifyAndCheckIn: function(appointmentId) {
      var appointments = global.StorageEngine.getItem('appointments', []);
      var apt = appointments.find(function(a) { return a.appointmentId === appointmentId; });
      if (!apt) return { success: false, message: 'Appointment not found.' };

      if (apt.status === 'CHECKED_IN') {
        return { success: false, message: 'Patient is already checked in.' };
      }

      apt.status = 'CHECKED_IN';
      global.StorageEngine.setItem('appointments', appointments);

      // Issue Live Queue Token
      var tokenRes = global.QueueEngine ? global.QueueEngine.issueToken(apt) : null;

      if (global.NotificationsEngine) {
        global.NotificationsEngine.add('Patient', apt.patientId, 'Check-In Complete', 'Token ' + (tokenRes ? tokenRes.token : 'Issued') + ' generated successfully!', 'success');
      }

      if (global.AuditEngine) {
        global.AuditEngine.log('PATIENT_CHECKED_IN', 'Patient ' + apt.patientId + ' checked in for appointment ' + appointmentId, 'CHECKIN');
      }

      return { success: true, appointment: apt, queueToken: tokenRes };
    }
  };

  global.AppointmentsEngine = AppointmentsEngine;

})(typeof window !== 'undefined' ? window : this);
