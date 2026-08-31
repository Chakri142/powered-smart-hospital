/* ==========================================================================
   POWERED SMART HOSPITAL (PSH) - AUTH & RBAC ENGINE
   ========================================================================== */

(function(global) {
  'use strict';

  var ROLES = {
    PATIENT: 'Patient',
    RECEPTIONIST: 'Receptionist',
    NURSE: 'Queue Operator / Nurse',
    DOCTOR: 'Doctor',
    ADMIN: 'Administrator'
  };

  var ALL_VIEWS = [
    'view-home', 'view-departments', 'view-doctor-directory', 'view-doctor-profile', 
    'view-login', 'view-register', 'view-login-patient', 'view-register-patient', 'view-login-staff', 'view-register-staff',
    'view-patient-dashboard', 'view-request-appointment', 'view-my-requests', 
    'view-appointment-details', 'view-checkin', 'view-live-queue', 'view-patient-profile', 
    'view-visit-summary', 'view-reception-dashboard', 'view-request-review', 
    'view-queue-control', 'view-todays-appointments', 'view-patient-search', 
    'view-triage-station', 'view-doctor-dashboard', 'view-clinical-record', 
    'view-doctor-leave', 'view-admin-dashboard', 'view-doctor-management', 
    'view-schedule-management', 'view-department-management', 'view-room-management', 
    'view-queue-rules', 'view-reports-audit', 'view-public-tv', 'view-analytics-dashboard'
  ];

  var ROLE_PERMISSIONS = {
    'Unauthenticated': ALL_VIEWS,
    'Patient': ALL_VIEWS,
    'Receptionist': ALL_VIEWS,
    'Queue Operator / Nurse': ALL_VIEWS,
    'Doctor': ALL_VIEWS,
    'Administrator': ALL_VIEWS
  };

  var AuthEngine = {
    ROLES: ROLES,

    isAuthenticated: function() {
      return sessionStorage.getItem('psh_is_authenticated') === 'true';
    },

    getCurrentRole: function() {
      if (!this.isAuthenticated()) return 'Unauthenticated';
      return sessionStorage.getItem('psh_current_role') || ROLES.PATIENT;
    },

    getCurrentUserIdentifier: function() {
      return sessionStorage.getItem('psh_user_identifier') || 'Guest';
    },

    getCurrentPatientId: function() {
      return sessionStorage.getItem('psh_patient_id') || 'PID-2026-1001';
    },

    getCurrentDoctorId: function() {
      return sessionStorage.getItem('psh_doctor_id') || 'doc_1';
    },

    // Patient Sign In
    loginPatient: function(patientId) {
      sessionStorage.setItem('psh_is_authenticated', 'true');
      sessionStorage.setItem('psh_current_role', ROLES.PATIENT);
      sessionStorage.setItem('psh_user_identifier', patientId || 'PID-2026-1001');
      sessionStorage.setItem('psh_patient_id', patientId || 'PID-2026-1001');

      if (global.AuditEngine) {
        global.AuditEngine.log('PATIENT_LOGIN', 'Patient ' + patientId + ' logged in');
      }
      return true;
    },

    // Patient Registration / Sign Up System
    registerPatient: function(patientData) {
      if (!global.StorageEngine) return { success: false, message: 'Storage unavailable' };
      var res = global.StorageEngine.addPatient(patientData);
      if (res.success && global.AuditEngine) {
        global.AuditEngine.log('PATIENT_REGISTERED', 'New patient ' + patientData.patientId + ' (' + patientData.name + ') registered.');
      }
      return res;
    },

    // Staff Sign In (Requires Unique Employee ID + Passcode)
    loginEmployee: function(employeeId, passcode) {
      if (!global.StorageEngine) return { success: false, message: 'Storage unavailable' };

      var employees = global.StorageEngine.getItem('employees', []);
      var emp = employees.find(function(e) {
        return e.employeeId.toUpperCase() === employeeId.trim().toUpperCase() && e.passcode === passcode.trim();
      });

      if (!emp) {
        return { success: false, message: 'Invalid Employee ID or Passcode.' };
      }

      sessionStorage.setItem('psh_is_authenticated', 'true');
      sessionStorage.setItem('psh_current_role', emp.role);
      sessionStorage.setItem('psh_user_identifier', emp.employeeId + ' (' + emp.name + ')');
      if (emp.doctorId) sessionStorage.setItem('psh_doctor_id', emp.doctorId);

      if (global.AuditEngine) {
        global.AuditEngine.log('STAFF_LOGIN', 'Employee ' + emp.employeeId + ' logged in as ' + emp.role);
      }

      return { success: true, employee: emp };
    },

    // Staff Registration / Sign Up System
    registerStaff: function(staffData) {
      if (!global.StorageEngine) return { success: false, message: 'Storage unavailable' };

      var res = global.StorageEngine.addEmployee(staffData);
      if (res.success && global.AuditEngine) {
        global.AuditEngine.log('STAFF_REGISTERED', 'New staff ' + staffData.employeeId + ' (' + staffData.name + ') registered as ' + staffData.role);
      }
      return res;
    },

    canAccessRoute: function(viewId, role) {
      if (viewId === 'view-login' || viewId === 'view-register' || viewId === 'view-home' || viewId === 'view-departments' || viewId === 'view-doctor-directory' || viewId === 'view-public-tv') {
        return true;
      }
      role = role || this.getCurrentRole();
      var allowedViews = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['Unauthenticated'];
      return allowedViews.indexOf(viewId) !== -1;
    },

    logout: function() {
      sessionStorage.clear();
      if (global.AuditEngine) {
        global.AuditEngine.log('USER_LOGOUT', 'User logged out');
      }
      window.location.hash = '#login';
    }
  };

  global.AuthEngine = AuthEngine;

})(typeof window !== 'undefined' ? window : this);
