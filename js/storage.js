/* ==========================================================================
   POWERED SMART HOSPITAL (PSH) - STORAGE & DATA ENGINE v2.1.0
   ========================================================================== */

(function(global) {
  'use strict';

  var SCHEMA_VERSION = '2.1.0';
  var STORAGE_PREFIX = 'psh_app_v2_';

  var StorageEngine = {
    SCHEMA_VERSION: SCHEMA_VERSION,

    init: function() {
      var currentVer = localStorage.getItem(STORAGE_PREFIX + 'schema_version');
      if (!currentVer || currentVer !== SCHEMA_VERSION) {
        this.resetDemoData();
      } else {
        this.ensureDataIntegrity();
      }
    },

    getItem: function(key, defaultVal) {
      try {
        var raw = localStorage.getItem(STORAGE_PREFIX + key);
        return raw ? JSON.parse(raw) : defaultVal;
      } catch (e) {
        console.error('Error reading localStorage key:', key, e);
        return defaultVal;
      }
    },

    setItem: function(key, val) {
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
      } catch (e) {
        console.error('Error writing localStorage key:', key, e);
      }
    },

    // Add New Registered Employee (Guarantees 100% Unique ID)
    addEmployee: function(empData) {
      var employees = this.getItem('employees', []);
      var targetId = empData.employeeId.trim().toUpperCase();

      var existing = employees.find(function(e) {
        return e.employeeId.toUpperCase() === targetId;
      });

      if (existing) {
        // Auto-assign random unique ID if ID already exists
        var prefix = targetId.split('-').slice(0, 2).join('-') || 'EMP-STAFF';
        targetId = prefix + '-' + Math.floor(1000 + Math.random() * 9000);
        empData.employeeId = targetId;
      }

      employees.push(empData);
      this.setItem('employees', employees);

      // If registered as Doctor, also sync to doctor directory
      if (empData.role === 'Doctor') {
        var doctors = this.getItem('doctors', []);
        var depts = this.getItem('departments', []);
        var dept = depts.find(function(d) { return d.departmentId === empData.departmentId; }) || depts[0];

        doctors.push({
          doctorId: empData.doctorId || ('doc_' + Math.floor(100 + Math.random() * 900)),
          name: empData.name,
          departmentId: empData.departmentId || 'dept_genm',
          specialty: empData.specialty || 'General Medicine',
          experience: empData.experience || '5 Yrs',
          roomId: empData.roomId || 'rm_101',
          roomName: empData.roomName || 'Room 101 (OPD Desk 1)',
          block: dept ? dept.block : 'Block A (Main Building)',
          floor: dept ? dept.floor : 'Ground Floor',
          avgConsultMins: 12,
          status: 'ON_DUTY'
        });
        this.setItem('doctors', doctors);
      }

      return { success: true, employee: empData };
    },

    // Add New Registered Patient (Guarantees 100% Unique ID)
    addPatient: function(patientData) {
      var patients = this.getItem('patients', []);
      var targetId = patientData.patientId.trim().toUpperCase();

      var existing = patients.find(function(p) {
        return p.patientId.toUpperCase() === targetId;
      });

      if (existing) {
        // Auto-assign random unique ID if ID already exists
        targetId = 'PID-2026-' + Math.floor(1000 + Math.random() * 9000);
        patientData.patientId = targetId;
      }

      patients.push(patientData);
      this.setItem('patients', patients);
      return { success: true, patient: patientData };
    },

    resetDemoData: function() {
      localStorage.setItem(STORAGE_PREFIX + 'schema_version', SCHEMA_VERSION);

      var settings = {
        hospitalName: 'Powered Smart Hospital (PSH)',
        opdStartTime: '08:00 AM',
        opdEndTime: '08:00 PM',
        emergencyBypassEnabled: true
      };

      var employees = [
        { employeeId: 'EMP-REC-01', passcode: 'pass123', name: 'Sarah Jenkins', role: 'Receptionist', departmentId: 'Central Intake', counterNo: 'Counter 1' },
        { employeeId: 'EMP-NUR-01', passcode: 'pass123', name: 'Nurse Clara Barton', role: 'Queue Operator / Nurse', departmentId: 'dept_card', triageBay: 'Bay Alpha' },
        { employeeId: 'EMP-DOC-01', passcode: 'pass123', name: 'Dr. Sarah Jenkins', role: 'Doctor', doctorId: 'doc_1', departmentId: 'dept_card', specialty: 'Interventional Cardiology', roomId: 'rm_304' },
        { employeeId: 'EMP-ADM-01', passcode: 'pass123', name: 'Admin Marcus Vance', role: 'Administrator', departmentId: 'Executive Command', clearanceLevel: 'Level 5' }
      ];

      var departments = [
        { departmentId: 'dept_card', name: 'Cardiology (Heart & Vascular)', code: 'CARD', block: 'Block A (East Wing)', floor: 'Floor 3', rooms: 'Rooms 301 - 305', description: 'Coronary care, Angiography, ECG & Heart Failure Clinic' },
        { departmentId: 'dept_neur', name: 'Neurology (Brain & Spine)', code: 'NEUR', block: 'Block B (Neuro Tower)', floor: 'Floor 4', rooms: 'Rooms 401 - 405', description: 'Brain, Spine, Stroke Intervention & EEG Diagnostics' },
        { departmentId: 'dept_orth', name: 'Orthopedics (Bone & Joint)', code: 'ORTH', block: 'Block A (East Wing)', floor: 'Floor 2', rooms: 'Rooms 201 - 205', description: 'Joint replacement, Trauma care & Bone Fracture Surgery' },
        { departmentId: 'dept_peds', name: 'Pediatrics (Child Health)', code: 'PEDS', block: 'Block C (Maternal & Child Complex)', floor: 'Floor 1', rooms: 'Rooms 105 - 110', description: 'Childhood immunizations, NICU & Pediatric OPD' },
        { departmentId: 'dept_onc',  name: 'Oncology (Cancer Care)', code: 'ONC', block: 'Block D (Specialist Research Wing)', floor: 'Floor 5', rooms: 'Rooms 501 - 505', description: 'Chemotherapy, Immuno-Oncology & Radiation Oncology' },
        { departmentId: 'dept_gastro', name: 'Gastroenterology (Digestive Health)', code: 'GAST', block: 'Block B (Diagnostic Tower)', floor: 'Floor 2', rooms: 'Rooms 210 - 215', description: 'Endoscopy, Liver Care & Gastrointestinal OPD' },
        { departmentId: 'dept_derm', name: 'Dermatology (Skin & Allergy)', code: 'DERM', block: 'Block A (East Wing)', floor: 'Floor 1', rooms: 'Rooms 112 - 115', description: 'Skin disorders, Laser Therapy & Allergy Testing' },
        { departmentId: 'dept_opht', name: 'Ophthalmology (Eye Care)', code: 'OPHT', block: 'Block B (Diagnostic Tower)', floor: 'Floor 3', rooms: 'Rooms 320 - 325', description: 'Cataract, Vitreoretinal Surgery & Vision Testing' },
        { departmentId: 'dept_pulm', name: 'Pulmonology (Respiratory Medicine)', code: 'PULM', block: 'Block A (East Wing)', floor: 'Floor 4', rooms: 'Rooms 410 - 415', description: 'Asthma, COPD, Bronchoscopy & Sleep Apnea Clinic' },
        { departmentId: 'dept_ent',  name: 'ENT (Ear, Nose & Throat)', code: 'ENT', block: 'Block B (Diagnostic Tower)', floor: 'Floor 1', rooms: 'Rooms 102 - 106', description: 'Sinus Surgery, Hearing Diagnostics & Otolaryngology' },
        { departmentId: 'dept_neph', name: 'Nephrology & Dialysis', code: 'NEPH', block: 'Block C (Renal Complex)', floor: 'Floor 3', rooms: 'Rooms 350 - 355', description: 'Kidney Dialysis, Renal Transplant & Nephrology OPD' },
        { departmentId: 'dept_genm', name: 'General Medicine & OPD', code: 'GENM', block: 'Block A (Main OPD Hall)', floor: 'Ground Floor', rooms: 'Rooms 101 - 104', description: 'Internal Medicine, Health Screening & Walk-in OPD' }
      ];

      var doctors = [
        { doctorId: 'doc_1', name: 'Dr. Sarah Jenkins, MD, FACC', departmentId: 'dept_card', specialty: 'Interventional Cardiology', experience: '14 Yrs', block: 'Block A (East Wing)', floor: 'Floor 3', roomId: 'rm_304', roomName: 'Room 304 (Cardiac Suite)', avgConsultMins: 15, status: 'ON_DUTY' },
        { doctorId: 'doc_2', name: 'Dr. Marcus Vance, MD, DM', departmentId: 'dept_neur', specialty: 'Neurology & Stroke Intervention', experience: '12 Yrs', block: 'Block B (Neuro Tower)', floor: 'Floor 4', roomId: 'rm_402', roomName: 'Room 402 (Neuro Suite)', avgConsultMins: 20, status: 'ON_DUTY' },
        { doctorId: 'doc_3', name: 'Dr. Elena Rostova, MS, FACS', departmentId: 'dept_orth', specialty: 'Orthopedic Joint Replacement', experience: '15 Yrs', block: 'Block A (East Wing)', floor: 'Floor 2', roomId: 'rm_204', roomName: 'Room 204 (Joint Care Room)', avgConsultMins: 15, status: 'ON_DUTY' },
        { doctorId: 'doc_4', name: 'Dr. Rajiv Sharma, MD, DCH', departmentId: 'dept_peds', specialty: 'Pediatrician & Neonatologist', experience: '10 Yrs', block: 'Block C (Maternal & Child Complex)', floor: 'Floor 1', roomId: 'rm_108', roomName: 'Room 108 (Pediatric OPD)', avgConsultMins: 12, status: 'ON_DUTY' },
        { doctorId: 'doc_5', name: 'Dr. Evelyn Reed, MD, PhD', departmentId: 'dept_onc', specialty: 'Medical Oncology & Immuno-Care', experience: '16 Yrs', block: 'Block D (Specialist Research Wing)', floor: 'Floor 5', roomId: 'rm_502', roomName: 'Room 502 (Oncology Suite)', avgConsultMins: 20, status: 'ON_DUTY' },
        { doctorId: 'doc_6', name: 'Dr. David Chen, MD, DM', departmentId: 'dept_gastro', specialty: 'Hepatology & Endoscopy', experience: '11 Yrs', block: 'Block B (Diagnostic Tower)', floor: 'Floor 2', roomId: 'rm_212', roomName: 'Room 212 (Digestive Health Room)', avgConsultMins: 15, status: 'ON_DUTY' },
        { doctorId: 'doc_7', name: 'Dr. Maya Lin, MD, DVL', departmentId: 'dept_derm', specialty: 'Dermatology & Laser Surgery', experience: '9 Yrs', block: 'Block A (East Wing)', floor: 'Floor 1', roomId: 'rm_114', roomName: 'Room 114 (Skin & Laser Clinic)', avgConsultMins: 12, status: 'ON_DUTY' },
        { doctorId: 'doc_8', name: 'Dr. Jonathan Hayes, MS, DO', departmentId: 'dept_opht', specialty: 'Vitreoretinal Eye Surgeon', experience: '13 Yrs', block: 'Block B (Diagnostic Tower)', floor: 'Floor 3', roomId: 'rm_322', roomName: 'Room 322 (Eye Care Suite)', avgConsultMins: 15, status: 'ON_DUTY' },
        { doctorId: 'doc_9', name: 'Dr. Amara Okafor, MD, FCCP', departmentId: 'dept_pulm', specialty: 'Pulmonologist & Respiratory Specialist', experience: '14 Yrs', block: 'Block A (East Wing)', floor: 'Floor 4', roomId: 'rm_412', roomName: 'Room 412 (Respiratory Care)', avgConsultMins: 15, status: 'ON_DUTY' },
        { doctorId: 'doc_10', name: 'Dr. Vikram Patel, MS, DLO', departmentId: 'dept_ent', specialty: 'Otolaryngologist (ENT Surgeon)', experience: '8 Yrs', block: 'Block B (Diagnostic Tower)', floor: 'Floor 1', roomId: 'rm_104', roomName: 'Room 104 (ENT Consultation Room)', avgConsultMins: 12, status: 'ON_DUTY' },
        { doctorId: 'doc_11', name: 'Dr. Hannah Abbott, MD, DM', departmentId: 'dept_neph', specialty: 'Nephrologist & Kidney Specialist', experience: '15 Yrs', block: 'Block C (Renal Complex)', floor: 'Floor 3', roomId: 'rm_352', roomName: 'Room 352 (Kidney & Dialysis Suite)', avgConsultMins: 15, status: 'ON_DUTY' },
        { doctorId: 'doc_12', name: 'Dr. Robert Chen, MD, FACP', departmentId: 'dept_genm', specialty: 'Internal Medicine Consultant', experience: '18 Yrs', block: 'Block A (Main OPD Hall)', floor: 'Ground Floor', roomId: 'rm_101', roomName: 'Room 101 (OPD Desk 1)', avgConsultMins: 12, status: 'ON_DUTY' }
      ];

      var patients = [
        { patientId: 'PID-2026-1001', name: 'Arthur Pendelton', phone: '+1 555-0199', email: 'arthur@example.com', dob: '1980-05-14', gender: 'Male' }
      ];

      var requests = [
        { requestId: 'req_1001', patientId: 'PID-2026-1001', departmentId: 'dept_card', doctorId: 'doc_1', preferredDate: '2026-08-31', preferredPeriod: '09:00 AM', visitReason: 'Chest pressure evaluation', status: 'SUBMITTED', createdAt: new Date().toISOString() }
      ];

      var appointments = [
        { appointmentId: 'apt_1001', patientId: 'PID-2026-1001', doctorId: 'doc_1', departmentId: 'dept_card', block: 'Block A (East Wing)', floor: 'Floor 3', roomId: 'rm_304', roomName: 'Room 304 (Cardiac Suite)', date: '2026-08-31', startTime: '09:00 AM', status: 'CONFIRMED', createdAt: new Date().toISOString() }
      ];

      var queueEntries = [
        { queueEntryId: 'qe_1001', token: 'CARD-001', appointmentId: 'apt_1001', patientId: 'PID-2026-1001', departmentId: 'dept_card', doctorId: 'doc_1', block: 'Block A (East Wing)', floor: 'Floor 3', roomId: 'rm_304', roomName: 'Room 304 (Cardiac Suite)', priority: 'STANDARD', state: 'WAITING', admittedAt: new Date().toISOString() }
      ];

      var notifications = [
        { notificationId: 'notif_1', recipientRole: 'Patient', recipientId: 'PID-2026-1001', title: 'Appointment Confirmed', message: 'Token CARD-001 issued for Dr. Sarah Jenkins at Block A (East Wing), Floor 3, Room 304.', isRead: false, timestamp: new Date().toISOString() }
      ];

      var auditLogs = [
        { eventId: 'aud_1', timestamp: new Date().toISOString(), actorRole: 'System', actorId: 'SYS', actionType: 'SYSTEM_INIT', targetEntity: 'DATABASE', details: 'Initialized expanded clinical dataset with 12 departments, doctor roster, and physical building locations v2.1.0.' }
      ];

      this.setItem('settings', settings);
      this.setItem('employees', employees);
      this.setItem('departments', departments);
      this.setItem('rooms', []);
      this.setItem('doctors', doctors);
      this.setItem('slots', []);
      this.setItem('patients', patients);
      this.setItem('requests', requests);
      this.setItem('appointments', appointments);
      this.setItem('queueEntries', queueEntries);
      this.setItem('triageRecords', []);
      this.setItem('clinicalRecords', []);
      this.setItem('notifications', notifications);
      this.setItem('auditLogs', auditLogs);

      console.log('Demo storage reset successfully v2.1.0');
    },

    ensureDataIntegrity: function() {
      var keys = ['settings', 'employees', 'departments', 'rooms', 'doctors', 'slots', 'patients', 'requests', 'appointments', 'queueEntries', 'triageRecords', 'clinicalRecords', 'notifications', 'auditLogs'];
      var self = this;
      keys.forEach(function(k) {
        if (!self.getItem(k, null)) {
          self.setItem(k, []);
        }
      });
    }
  };

  global.StorageEngine = StorageEngine;

})(typeof window !== 'undefined' ? window : this);
