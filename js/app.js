/* ==========================================================================
   POWERED SMART HOSPITAL (PSH) - MAIN SPA CONTROLLER & ROUTER
   ========================================================================== */

(function(global) {
  'use strict';

  var App = {
    currentView: 'view-home',

    init: function() {
      // 1. Storage & Data Engine Init
      if (global.StorageEngine) global.StorageEngine.init();

      // 2. Hash Router Listener
      var self = this;
      window.addEventListener('hashchange', function() { self.handleHashChange(); });

      // 3. Network Status Detector
      this.setupNetworkDetector();

      // 4. Initial View Load & Navigation Render
      this.handleHashChange();
      this.updateHeaderUI();

      console.log('Powered Smart Hospital (PSH) Vibrant Light Controller Initialized v2.0.0.');
    },

    selectRoleQuickLogin: function(roleKey) {
      var cards = document.querySelectorAll('.role-select-card');
      cards.forEach(function(c) { c.classList.remove('active-role'); });

      var targetCard = document.getElementById('role-card-' + roleKey);
      if (targetCard) targetCard.classList.add('active-role');

      var empInput = document.getElementById('login-empid');
      var passInput = document.getElementById('login-passcode');
      var pidInput = document.getElementById('login-pid');

      if (roleKey === 'patient') {
        this.switchLoginTab('patient');
        if (pidInput) pidInput.value = 'PID-2026-1001';
      } else {
        this.switchLoginTab('staff');
        if (passInput) passInput.value = 'pass123';
        if (empInput) {
          if (roleKey === 'receptionist') empInput.value = 'EMP-REC-01';
          else if (roleKey === 'nurse') empInput.value = 'EMP-NUR-01';
          else if (roleKey === 'doctor') empInput.value = 'EMP-DOC-01';
          else if (roleKey === 'admin') empInput.value = 'EMP-ADM-01';
        }
      }
    },

    switchLoginTab: function(tab) {
      this.activeLoginTab = tab;
      var pForm = document.getElementById('login-form-patient');
      var sForm = document.getElementById('login-form-staff');
      var pTab = document.getElementById('tab-btn-patient');
      var sTab = document.getElementById('tab-btn-staff');

      if (tab === 'patient') {
        if (pForm) pForm.style.display = 'block';
        if (sForm) sForm.style.display = 'none';
        if (pTab) pTab.className = 'btn login-tab-btn active-tab';
        if (sTab) sTab.className = 'btn login-tab-btn';
      } else {
        if (pForm) pForm.style.display = 'none';
        if (sForm) sForm.style.display = 'block';
        if (pTab) pTab.className = 'btn login-tab-btn';
        if (sTab) sTab.className = 'btn login-tab-btn active-tab-purple';
      }
    },

    generateRandomUniqueId: function(roleKey) {
      var prefix = 'PID-2026-';
      var isStaff = true;

      if (roleKey === 'Patient') {
        prefix = 'PID-2026-';
        isStaff = false;
      } else if (roleKey === 'Receptionist') {
        prefix = 'EMP-REC-';
      } else if (roleKey === 'Queue Operator / Nurse' || roleKey === 'Nurse') {
        prefix = 'EMP-NUR-';
      } else if (roleKey === 'Doctor') {
        prefix = 'EMP-DOC-';
      } else if (roleKey === 'Administrator' || roleKey === 'Admin') {
        prefix = 'EMP-ADM-';
      }

      var uniqueId = '';
      var attempts = 0;
      var storage = global.StorageEngine;

      while (attempts < 100) {
        var randomNum = Math.floor(1000 + Math.random() * 9000);
        uniqueId = prefix + randomNum;

        if (storage) {
          if (isStaff) {
            var emps = storage.getItem('employees', []);
            var exists = emps.some(function(e) { return e.employeeId.toUpperCase() === uniqueId.toUpperCase(); });
            if (!exists) break;
          } else {
            var pts = storage.getItem('patients', []);
            var exists = pts.some(function(p) { return p.patientId.toUpperCase() === uniqueId.toUpperCase(); });
            if (!exists) break;
          }
        } else {
          break;
        }
        attempts++;
      }

      return uniqueId;
    },

    autoGeneratePatientId: function() {
      var idInput = document.getElementById('reg-p-id');
      if (idInput) {
        var newId = this.generateRandomUniqueId('Patient');
        idInput.value = newId;
        if (global.NotificationsEngine) {
          global.NotificationsEngine.showToast('Unique ID Generated', 'Assigned Patient Registration ID: ' + newId, 'info');
        }
      }
    },

    autoGenerateStaffId: function() {
      var roleSelect = document.getElementById('reg-role');
      var empIdInput = document.getElementById('reg-empid');
      var role = roleSelect ? roleSelect.value : 'Receptionist';

      if (empIdInput) {
        var newId = this.generateRandomUniqueId(role);
        empIdInput.value = newId;
        if (global.NotificationsEngine) {
          global.NotificationsEngine.showToast('Unique Staff ID Generated', 'Assigned Employee Badge ID: ' + newId, 'info');
        }
      }
    },

    switchRegisterTab: function(tab) {
      var pForm = document.getElementById('reg-form-patient');
      var sForm = document.getElementById('reg-form-staff');
      var pTab = document.getElementById('reg-tab-btn-patient');
      var sTab = document.getElementById('reg-tab-btn-staff');

      if (tab === 'patient') {
        if (pForm) pForm.style.display = 'block';
        if (sForm) sForm.style.display = 'none';
        if (pTab) pTab.className = 'btn login-tab-btn active-tab';
        if (sTab) sTab.className = 'btn login-tab-btn';
        this.autoGeneratePatientId();
      } else {
        if (pForm) pForm.style.display = 'none';
        if (sForm) sForm.style.display = 'block';
        if (pTab) pTab.className = 'btn login-tab-btn';
        if (sTab) sTab.className = 'btn login-tab-btn active-tab-purple';
        this.autoGenerateStaffId();
      }
    },

    // Dynamic Role-Specific Registration Fields & Department Visibility
    onStaffRoleChange: function() {
      var roleSelect = document.getElementById('reg-role');
      var empIdInput = document.getElementById('reg-empid');
      var deptContainer = document.getElementById('reg-dept-container');
      var deptSelect = document.getElementById('reg-dept');
      var deptHelp = document.getElementById('reg-dept-help');
      var roleFieldsContainer = document.getElementById('reg-role-fields');

      if (!roleSelect || !roleFieldsContainer) return;

      var role = roleSelect.value;

      if (empIdInput) {
        empIdInput.value = this.generateRandomUniqueId(role);
      }

      // Department Visibility
      var requiresDepartment = (role === 'Queue Operator / Nurse' || role === 'Doctor');

      if (deptContainer && deptSelect) {
        if (requiresDepartment) {
          deptContainer.style.opacity = '1';
          deptSelect.disabled = false;
          if (deptHelp) deptHelp.style.display = 'none';
        } else {
          deptContainer.style.opacity = '0.5';
          deptSelect.disabled = true;
          if (deptHelp) deptHelp.style.display = 'block';
        }
      }

      // Render Specialized Fields
      var html = '';
      if (role === 'Doctor') {
        html = '<div class="form-group"><label class="form-label">Medical Specialty</label><input type="text" id="reg-doctor-specialty" class="form-input" value="Interventional Cardiology" required></div>' +
               '<div class="form-group"><label class="form-label">Assigned Consultation Room</label><input type="text" id="reg-doctor-room" class="form-input" value="Room 304 (East Wing)" required></div>' +
               '<div class="form-group"><label class="form-label">Clinical Experience</label><input type="text" id="reg-doctor-exp" class="form-input" value="12 Years" required></div>' +
               '<div class="form-group"><label class="form-label">Medical Council License No.</label><input type="text" id="reg-license" class="form-input" value="MD-LIC-2026-99" required></div>';
      } else if (role === 'Queue Operator / Nurse') {
        html = '<div class="form-group"><label class="form-label">Triage Certification Level</label><select id="reg-nurse-cert" class="form-select"><option value="Certified Emergency Nurse (CEN)">Certified Emergency Nurse (CEN)</option><option value="Advanced Cardiac Triage">Advanced Cardiac Triage</option><option value="General OPD Triage Specialist">General OPD Triage Specialist</option></select></div>' +
               '<div class="form-group"><label class="form-label">Assigned Triage Station / Bay</label><input type="text" id="reg-nurse-bay" class="form-input" value="Triage Station Alpha (Main Hall)" required></div>' +
               '<div class="form-group" style="grid-column: span 2;"><label class="form-label">Nursing Council License No.</label><input type="text" id="reg-license" class="form-input" value="RN-LIC-2026-88" required></div>';
      } else if (role === 'Receptionist') {
        html = '<div class="form-group"><label class="form-label">Front Desk Counter No.</label><select id="reg-rec-counter" class="form-select"><option value="Counter 1 - Main OPD Hall">Counter 1 - Main OPD Hall</option><option value="Counter 2 - Emergency Intake">Counter 2 - Emergency Intake</option><option value="Counter 3 - Specialist Desk">Counter 3 - Specialist Desk</option></select></div>' +
               '<div class="form-group"><label class="form-label">Working Shift Schedule</label><select id="reg-rec-shift" class="form-select"><option value="Morning Shift (08:00 AM - 04:00 PM)">Morning Shift (08:00 AM - 04:00 PM)</option><option value="Evening Shift (04:00 PM - 12:00 AM)">Evening Shift (04:00 PM - 12:00 AM)</option></select></div>' +
               '<div class="form-group" style="grid-column: span 2;"><label class="form-label">Receptionist Staff Badge ID</label><input type="text" id="reg-license" class="form-input" value="REC-BADGE-102" required></div>';
      } else if (role === 'Administrator') {
        html = '<div class="form-group"><label class="form-label">Admin Security Clearance Level</label><select id="reg-adm-level" class="form-select"><option value="Super Administrator (Executive Command)">Super Administrator (Executive Command)</option><option value="Operations & IT Manager">Operations & IT Manager</option></select></div>' +
               '<div class="form-group"><label class="form-label">Facility Control Zone</label><input type="text" id="reg-adm-zone" class="form-input" value="Hospital-Wide Control Center" required></div>' +
               '<div class="form-group" style="grid-column: span 2;"><label class="form-label">Security Clearance Authority ID</label><input type="text" id="reg-license" class="form-input" value="ADM-CLR-LEVEL-5" required></div>';
      }

      roleFieldsContainer.innerHTML = html;
    },

    handlePatientRegistration: function() {
      var name = document.getElementById('reg-p-name').value;
      var pid = document.getElementById('reg-p-id').value;
      var phone = document.getElementById('reg-p-phone').value;
      var email = document.getElementById('reg-p-email').value;

      if (!name || !pid) {
        if (global.ModalEngine) global.ModalEngine.alert('Incomplete Registration', 'Please enter patient name and patient ID.', 'warning');
        return;
      }

      var res = global.AuthEngine.registerPatient({
        patientId: pid.trim().toUpperCase(),
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        createdAt: new Date().toISOString()
      });

      if (res.success) {
        if (global.ModalEngine) {
          global.ModalEngine.alert('Patient Account Created!', 'Patient ID: ' + res.patient.patientId + '\nName: ' + res.patient.name + '\n\nYou can now log in to your Patient Portal companion.', 'success', function() {
            var loginPidInput = document.getElementById('login-pid');
            if (loginPidInput) loginPidInput.value = res.patient.patientId;
            window.location.hash = '#login-patient';
          });
        }
      } else {
        if (global.ModalEngine) global.ModalEngine.alert('Registration Failed', res.message, 'danger');
      }
    },

    handleStaffRegistration: function() {
      var name = document.getElementById('reg-name').value;
      var role = document.getElementById('reg-role').value;
      var empId = document.getElementById('reg-empid').value;
      var pass = document.getElementById('reg-passcode').value;
      var deptSelect = document.getElementById('reg-dept');
      var licenseEl = document.getElementById('reg-license');

      var dept = (role === 'Queue Operator / Nurse' || role === 'Doctor') ? deptSelect.value : 'Central / Hospital-Wide';
      var license = licenseEl ? licenseEl.value : 'LIC-GEN-01';

      if (!name || !empId || !pass) {
        if (global.ModalEngine) global.ModalEngine.alert('Incomplete Registration', 'Please fill in all required registration fields.', 'warning');
        return;
      }

      var staffObj = {
        employeeId: empId.trim().toUpperCase(),
        name: name.trim(),
        role: role,
        passcode: pass.trim(),
        departmentId: dept,
        licenseNo: license
      };

      if (role === 'Doctor') {
        var spec = document.getElementById('reg-doctor-specialty');
        var rm = document.getElementById('reg-doctor-room');
        var exp = document.getElementById('reg-doctor-exp');
        staffObj.specialty = spec ? spec.value : 'General Medicine';
        staffObj.roomId = rm ? rm.value : 'rm_102';
        staffObj.experience = exp ? exp.value : '5 Yrs';
        staffObj.doctorId = 'doc_' + Math.floor(100 + Math.random() * 900);
      }

      var res = global.AuthEngine.registerStaff(staffObj);

      if (res.success) {
        var msg = 'Staff Registration Successful!\n\nRegistered Staff Name: ' + staffObj.name + '\nRole: ' + staffObj.role + '\nUnique Employee ID: ' + staffObj.employeeId + '\nPasscode: ' + staffObj.passcode + '\n\nYou can now log in directly via the Staff Command portal.';

        if (global.ModalEngine) {
          global.ModalEngine.alert('Staff Credentials Issued!', msg, 'success', function() {
            var loginEmpInput = document.getElementById('login-empid');
            var loginPassInput = document.getElementById('login-passcode');
            if (loginEmpInput) loginEmpInput.value = staffObj.employeeId;
            if (loginPassInput) loginPassInput.value = staffObj.passcode;
            window.location.hash = '#login-staff';
          });
        }
      } else {
        if (global.ModalEngine) global.ModalEngine.alert('Registration Failed', res.message, 'danger');
      }
    },

    handleHashChange: function() {
      var hash = window.location.hash.replace('#', '') || 'home';
      var viewId = 'view-' + hash;

      // Validate RBAC Route Access
      if (global.AuthEngine) {
        var currentRole = global.AuthEngine.getCurrentRole();
        if (!global.AuthEngine.canAccessRoute(viewId, currentRole)) {
          if (global.NotificationsEngine) {
            global.NotificationsEngine.add('System', 'SYS', 'Access Restricted', 'Please sign in with valid credentials to access portal section #' + hash, 'warning');
          }
          window.location.hash = '#login-patient';
          return;
        }
      }

      this.switchView(viewId);
    },

    switchView: function(viewId) {
      var views = document.querySelectorAll('.view-container');
      views.forEach(function(v) { v.style.display = 'none'; });

      var targetView = document.getElementById(viewId) || document.getElementById('view-home');
      if (targetView) {
        targetView.style.display = 'block';
        this.currentView = targetView.id;
        if (window.scrollTo) window.scrollTo(0, 0);

        this.renderViewContent(targetView.id);
      }

      this.updateHeaderUI();
    },

    handleAuthBtnClick: function() {
      if (global.AuthEngine && global.AuthEngine.isAuthenticated()) {
        if (global.ModalEngine) {
          global.ModalEngine.confirm('Sign Out Confirmation', 'Are you sure you want to end your active session?', function() {
            global.AuthEngine.logout();
            App.updateHeaderUI();
          });
        }
      } else {
        window.location.hash = '#login';
      }
    },

    updateHeaderUI: function() {
      var isAuth = global.AuthEngine ? global.AuthEngine.isAuthenticated() : false;
      var currentRole = global.AuthEngine ? global.AuthEngine.getCurrentRole() : 'Unauthenticated';

      var roleTag = document.getElementById('header-user-role');
      var authBtn = document.getElementById('auth-btn');

      if (roleTag) roleTag.textContent = isAuth ? currentRole : 'Guest';

      if (authBtn) {
        if (isAuth) {
          authBtn.className = 'btn btn-danger btn-sm';
          authBtn.innerHTML = '<span class="btn-icon">🔒</span> Logout';
        } else {
          authBtn.className = 'btn btn-primary btn-sm';
          authBtn.innerHTML = '<span class="btn-icon">🔑</span> Sign In';
        }
      }

      // Render Dynamic Role-Specific Nav Links (Clean, Uncluttered)
      var navContainer = document.getElementById('main-nav-links');
      if (navContainer) {
        var linksHtml = '<li><a href="#home" class="nav-link">Home</a></li>';

        if (currentRole === 'Unauthenticated') {
          linksHtml += '<li><a href="#departments" class="nav-link">Departments</a></li>' +
                       '<li><a href="#doctor-directory" class="nav-link">Doctors</a></li>' +
                       '<li><a href="#public-tv" class="nav-link">Public TV</a></li>';
        } else if (currentRole === 'Patient') {
          linksHtml += '<li><a href="#patient-dashboard" class="nav-link">My Portal</a></li>' +
                       '<li><a href="#request-appointment" class="nav-link">Book Visit</a></li>' +
                       '<li><a href="#live-queue" class="nav-link">Live Token</a></li>' +
                       '<li><a href="#public-tv" class="nav-link">Public TV</a></li>';
        } else if (currentRole === 'Receptionist') {
          linksHtml += '<li><a href="#reception-dashboard" class="nav-link">Reception Desk</a></li>' +
                       '<li><a href="#analytics-dashboard" class="nav-link">📊 Analytics & Charts</a></li>' +
                       '<li><a href="#public-tv" class="nav-link">Public TV Board</a></li>';
        } else if (currentRole === 'Queue Operator / Nurse') {
          linksHtml += '<li><a href="#triage-station" class="nav-link">Triage Nurse Station</a></li>' +
                       '<li><a href="#analytics-dashboard" class="nav-link">📊 Analytics & Charts</a></li>' +
                       '<li><a href="#public-tv" class="nav-link">Public TV Board</a></li>';
        } else if (currentRole === 'Doctor') {
          linksHtml += '<li><a href="#doctor-dashboard" class="nav-link">Doctor Workstation</a></li>' +
                       '<li><a href="#analytics-dashboard" class="nav-link">📊 Analytics & Charts</a></li>' +
                       '<li><a href="#public-tv" class="nav-link">Public TV Board</a></li>';
        } else if (currentRole === 'Administrator') {
          linksHtml += '<li><a href="#admin-dashboard" class="nav-link">Admin System</a></li>' +
                       '<li><a href="#analytics-dashboard" class="nav-link">📊 Analytics & Charts</a></li>' +
                       '<li><a href="#reports-audit" class="nav-link">Audit Trail</a></li>' +
                       '<li><a href="#public-tv" class="nav-link">Public TV</a></li>';
        }

        navContainer.innerHTML = linksHtml;
      }

      // Highlight Active Nav Link
      var currentHash = window.location.hash || '#home';
      var navLinks = document.querySelectorAll('#main-nav-links .nav-link');
      navLinks.forEach(function(link) {
        if (link.getAttribute('href') === currentHash) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    },

    setupNetworkDetector: function() {
      var badge = document.getElementById('network-badge');
      if (!badge) return;

      var updateStatus = function() {
        if (navigator.onLine) {
          badge.className = 'network-badge';
          badge.innerHTML = '● ONLINE';
        } else {
          badge.className = 'network-badge offline';
          badge.innerHTML = '● LOCAL MODE';
        }
      };

      window.addEventListener('online', updateStatus);
      window.addEventListener('offline', updateStatus);
      updateStatus();
    },

    // Render Dynamic Content for Active View
    renderViewContent: function(viewId) {
      switch(viewId) {
        case 'view-home': this.renderHomeView(); break;
        case 'view-departments': this.renderDepartmentsView(); break;
        case 'view-doctor-directory': this.renderDoctorDirectoryView(); break;
        case 'view-patient-dashboard': this.renderPatientDashboardView(); break;
        case 'view-reception-dashboard': this.renderReceptionDashboardView(); break;
        case 'view-doctor-dashboard': this.renderDoctorDashboardView(); break;
        case 'view-admin-dashboard': this.renderAdminDashboardView(); break;
        case 'view-analytics-dashboard': this.renderAnalyticsDashboardView(); break;
        case 'view-live-queue': this.renderLiveQueueView(); break;
        case 'view-public-tv': this.renderPublicTVView(); break;
        case 'view-reports-audit': this.renderAuditLogsView(); break;
      }
    },

    renderAnalyticsDashboardView: function() {
      this.refreshAnalyticsDashboard();
    },

    refreshAnalyticsDashboard: function() {
      var storage = global.StorageEngine;
      if (!storage) return;

      var appointments = storage.getItem('appointments', []);
      var queueEntries = storage.getItem('queueEntries', []);
      var doctors = storage.getItem('doctors', []);

      // KPI Calculations
      var todayAppointmentsCount = appointments.length > 0 ? (appointments.length * 12 + 4) : 184;
      var queueWaitingCount = queueEntries.filter(function(q) { return q.state === 'WAITING'; }).length || 23;
      var activeDocsCount = doctors.filter(function(d) { return d.status === 'ON_DUTY'; }).length || 12;

      var kpiToday = document.getElementById('kpi-today-appointments');
      var kpiQueue = document.getElementById('kpi-queue-count');
      var kpiWait = document.getElementById('kpi-avg-wait');
      var kpiDocs = document.getElementById('kpi-active-doctors');

      if (kpiToday) kpiToday.innerText = todayAppointmentsCount;
      if (kpiQueue) kpiQueue.innerText = queueWaitingCount;
      if (kpiWait) kpiWait.innerText = '14 min';
      if (kpiDocs) kpiDocs.innerText = activeDocsCount;

      // Render Bar Chart (Appointments by Department) - Prototype: Cardiology: 78, Orthopedics: 55, Pediatrics: 64, General: 90, ENT: 40, Dental/Neph: 47
      if (global.ChartEngine) {
        global.ChartEngine.renderBarChart('chart-dept-bar-container', {
          labels: ['Cardiology', 'Orthopedics', 'Pediatrics', 'General', 'ENT', 'Dental'],
          data: [78, 55, 64, 90, 40, 47]
        });

        // Render Line Chart (Weekly Average Queue Length) - Prototype: Mon: 30, Tue: 42, Wed: 38, Thu: 55, Fri: 47, Sat: 33, Sun: 25
        global.ChartEngine.renderLineChart('chart-weekly-line-container', {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          data: [30, 42, 38, 55, 47, 33, 25]
        });

        // Render Hourly OPD Heatmap
        global.ChartEngine.renderHourlyHeatmap('hourly-heatmap-container', {
          hours: ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'],
          loads: [14, 32, 58, 65, 42, 24, 38, 49, 36, 18]
        });
      }
    },

    renderHomeView: function() {
      var container = document.getElementById('home-dept-list');
      if (!container) return;
      var depts = global.StorageEngine.getItem('departments', []);
      var html = '';
      depts.forEach(function(d) {
        html += '<div class="glass-card"><h3>' + d.name + ' (' + d.code + ')</h3><p style="color:var(--accent-blue); font-weight:700; margin:6px 0;">📍 ' + (d.block || 'Block A') + ' • ' + (d.floor || 'Floor 1') + '</p><p>' + d.description + '</p><a href="#doctor-directory" class="btn btn-secondary btn-sm" style="margin-top:14px;"><span class="btn-icon">🔍</span> Find Doctors</a></div>';
      });
      container.innerHTML = html;
    },

    renderDepartmentsView: function() {
      var container = document.getElementById('depts-grid');
      if (!container) return;
      var depts = global.StorageEngine.getItem('departments', []);
      var docs = global.StorageEngine.getItem('doctors', []);
      var html = '';
      depts.forEach(function(d) {
        var docCount = docs.filter(function(doc) { return doc.departmentId === d.departmentId; }).length;
        html += '<div class="glass-card"><h3>' + d.name + ' (' + d.code + ')</h3><div style="background:#f8fafc; padding:10px 14px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin:10px 0; font-size:0.9rem;"><div>🏢 <strong>Building Block:</strong> ' + (d.block || 'Block A (East Wing)') + '</div><div>🛗 <strong>Floor Level:</strong> ' + (d.floor || 'Floor 3') + '</div><div>🚪 <strong>Room Range:</strong> ' + (d.rooms || 'Rooms 301-305') + '</div></div><p>' + d.description + '</p><div class="flex-between" style="margin-top:16px;"><span class="badge badge-confirmed">' + docCount + ' Doctors On Duty</span><a href="#request-appointment" class="btn btn-glow btn-sm"><span class="btn-icon">📅</span> Book Service</a></div></div>';
      });
      container.innerHTML = html;
    },

    renderDoctorDirectoryView: function() {
      var container = document.getElementById('doctors-list');
      if (!container) return;
      var docs = global.StorageEngine.getItem('doctors', []);
      var depts = global.StorageEngine.getItem('departments', []);
      var html = '';
      docs.forEach(function(d) {
        var dept = depts.find(function(dp) { return dp.departmentId === d.departmentId; });
        var block = d.block || (dept ? dept.block : 'Block A (East Wing)');
        var floor = d.floor || (dept ? dept.floor : 'Floor 3');
        var room = d.roomName || (d.roomId ? d.roomId.replace('rm_', 'Room ') : 'Room 304');

        html += '<div class="glass-card"><div class="flex-between"><div><h3>' + d.name + '</h3><p style="margin:4px 0; font-weight:700; color:var(--accent-blue);">' + d.specialty + ' • ' + (dept ? dept.name : '') + '</p><div style="background:#f8fafc; padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); margin:8px 0; font-size:0.88rem;"><div>🏢 <strong>Block:</strong> ' + block + '</div><div>🛗 <strong>Floor:</strong> ' + floor + '</div><div>🚪 <strong>Consult Room:</strong> ' + room + '</div></div><small style="color:var(--text-light);">Experience: ' + d.experience + '</small></div><div><span class="badge badge-confirmed">' + d.status + '</span><br/><br/><a href="#request-appointment" class="btn btn-glow btn-sm"><span class="btn-icon">✉</span> Request Slot</a></div></div></div>';
      });
      container.innerHTML = html;
    },

    renderPatientDashboardView: function() {
      var pid = global.AuthEngine.getCurrentPatientId();
      var appointments = global.StorageEngine.getItem('appointments', []);
      var doctors = global.StorageEngine.getItem('doctors', []);
      var depts = global.StorageEngine.getItem('departments', []);

      var patientApts = appointments.filter(function(a) { return a.patientId === pid; });

      var container = document.getElementById('patient-apts-list');
      if (!container) return;

      if (patientApts.length === 0) {
        container.innerHTML = '<div class="glass-card"><p>No active appointments. <a href="#request-appointment" class="btn btn-glow btn-sm" style="margin-left:10px;">Book Appointment Now</a></p></div>';
        return;
      }

      var queueEntries = global.StorageEngine.getItem('queueEntries', []);
      var html = '';
      patientApts.forEach(function(a) {
        var doc = doctors.find(function(d) { return d.doctorId === a.doctorId; });
        var dept = depts.find(function(dp) { return dp.departmentId === a.departmentId; });
        var qe = queueEntries.find(function(q) { return q.appointmentId === a.appointmentId; });

        var block = a.block || (doc ? doc.block : (dept ? dept.block : 'Block A (East Wing)'));
        var floor = a.floor || (doc ? doc.floor : (dept ? dept.floor : 'Floor 3'));
        var room = a.roomName || (doc ? doc.roomName : (a.roomId ? a.roomId.replace('rm_', 'Room ') : 'Room 304'));

        html += '<div class="glass-card" style="margin-bottom:16px;"><div class="flex-between"><div><h3>Appointment #' + a.appointmentId.substring(4) + '</h3><p style="margin:4px 0; font-weight:700; color:var(--accent-blue);">Doctor: ' + (doc ? doc.name : 'Dr. Sarah Jenkins') + '</p><p>Date: ' + a.date + ' at ' + a.startTime + '</p><div style="background:#e0f2fe; color:#0369a1; padding:10px 14px; border-radius:var(--radius-md); margin:10px 0; border:1px solid #bae6fd; font-size:0.92rem;"><div>🏢 <strong>Building Block:</strong> ' + block + '</div><div>🛗 <strong>Floor Level:</strong> ' + floor + '</div><div>🚪 <strong>Consult Room:</strong> ' + room + '</div></div><span class="badge badge-' + a.status.toLowerCase().replace(/_/g, '-') + '">' + a.status + '</span></div><div>';
        if (a.status === 'CONFIRMED') {
          html += '<button onclick="App.doCheckIn(\'' + a.appointmentId + '\')" class="btn btn-primary"><span class="btn-icon">✓</span> Check-In Now</button>';
        } else if (qe) {
          html += '<a href="#live-queue" class="btn btn-glow"><span class="btn-icon">🔢</span> Token: ' + qe.token + '</a>';
        }
        html += '</div></div></div>';
      });
      container.innerHTML = html;
    },

    doCheckIn: function(aptId) {
      if (global.AppointmentsEngine) {
        var res = global.AppointmentsEngine.verifyAndCheckIn(aptId);
        if (res.success) {
          window.location.hash = '#live-queue';
        } else {
          if (global.ModalEngine) global.ModalEngine.alert('Check-in Notice', res.message, 'warning');
        }
      }
    },

    renderReceptionDashboardView: function() {
      var requests = global.StorageEngine.getItem('requests', []);
      var pending = requests.filter(function(r) { return r.status === 'SUBMITTED'; });
      var container = document.getElementById('reception-req-list');
      if (!container) return;

      if (pending.length === 0) {
        container.innerHTML = '<div class="glass-card"><p>No pending appointment requests requiring review.</p></div>';
        return;
      }

      var html = '';
      pending.forEach(function(r) {
        html += '<div class="glass-card" style="margin-bottom:16px;"><div class="flex-between"><div><h3>Request #' + r.requestId + '</h3><p>Patient: ' + r.patientId + ' • Reason: ' + r.visitReason + '</p><small style="color:var(--text-light);">Preferred Date: ' + r.preferredDate + ' (' + r.preferredPeriod + ')</small></div><div><button onclick="App.approveReq(\'' + r.requestId + '\')" class="btn btn-primary btn-sm"><span class="btn-icon">✓</span> Approve Slot</button></div></div></div>';
      });
      container.innerHTML = html;
    },

    issueWalkInOpdToken: function() {
      if (global.QueueEngine) {
        var res = global.QueueEngine.issueWalkInToken('dept_genm', 'PID-WALKIN-' + Math.floor(100 + Math.random() * 900));
        if (global.ModalEngine) {
          global.ModalEngine.alert('Walk-In Token Issued!', 'Token ' + res.token + ' generated for OPD Intake. Proceed to Triage Nurse.', 'success');
        }
        this.renderReceptionDashboardView();
      }
    },

    approveReq: function(reqId) {
      var requests = global.StorageEngine.getItem('requests', []);
      var req = requests.find(function(r) { return r.requestId === reqId; });
      if (!req) return;

      var slots = global.StorageEngine.getItem('slots', []);
      var freeSlot = slots.find(function(s) { return s.doctorId === req.doctorId && s.date === req.preferredDate && s.status === 'FREE'; });

      if (!freeSlot) {
        freeSlot = slots.find(function(s) { return s.status === 'FREE'; });
      }

      if (freeSlot || true) {
        var res = global.AppointmentsEngine.approveRequest(reqId, freeSlot ? freeSlot.slotId : 'slot_default');
        if (res.success) {
          if (global.ModalEngine) global.ModalEngine.alert('Appointment Confirmed', 'Appointment request approved and slot allocated!', 'success');
          this.renderReceptionDashboardView();
        }
      }
    },

    renderDoctorDashboardView: function() {
      var docId = global.AuthEngine.getCurrentDoctorId();
      var sortedQueue = global.QueueEngine ? global.QueueEngine.getSortedQueue(null, docId) : [];

      var currentContainer = document.getElementById('doctor-current-token');
      var queueContainer = document.getElementById('doctor-queue-list');

      var current = sortedQueue.find(function(q) { return q.state === 'CALLED' || q.state === 'IN_CONSULTATION'; });

      if (currentContainer) {
        if (current) {
          currentContainer.innerHTML = '<div class="now-serving-box"><p>ACTIVE CONSULTATION TOKEN</p><div class="token-display-number">' + current.token + '</div><p class="token-room-number">Patient ID: ' + current.patientId + ' • Priority: ' + current.priority + '</p><br/><button onclick="App.completeConsultation(\'' + current.queueEntryId + '\')" class="btn btn-glow btn-lg"><span class="btn-icon">✓</span> Complete Consultation & Discharge</button></div>';
        } else {
          currentContainer.innerHTML = '<div class="glass-card text-center" style="padding:40px;"><h3>No Active Patient in Consultation</h3><br/><button onclick="App.callNextPatient()" class="btn btn-primary btn-lg"><span class="btn-icon">📢</span> Call Next Patient (Voice + Chime)</button></div>';
        }
      }

      if (queueContainer) {
        var waiting = sortedQueue.filter(function(q) { return q.state === 'WAITING'; });
        var html = '';
        waiting.forEach(function(q) {
          html += '<div class="glass-card flex-between" style="margin-bottom:12px;"><div><strong style="font-size:1.15rem; color:var(--accent-blue);">' + q.token + '</strong> <span class="badge badge-priority-' + q.priority.toLowerCase() + '">' + q.priority + '</span><br/><small style="color:var(--text-light);">Admitted: ' + new Date(q.admittedAt).toLocaleTimeString() + '</small></div><span class="badge badge-waiting">WAITING</span></div>';
        });
        queueContainer.innerHTML = html || '<p style="color:var(--text-muted);">No waiting tokens in queue.</p>';
      }
    },

    callNextPatient: function() {
      var docId = global.AuthEngine.getCurrentDoctorId();
      var res = global.QueueEngine.callNextToken(docId);
      if (res.success) {
        this.renderDoctorDashboardView();
      } else {
        if (global.ModalEngine) global.ModalEngine.alert('Queue Control Notice', res.message, 'info');
      }
    },

    completeConsultation: function(qeId) {
      var queueEntries = global.StorageEngine.getItem('queueEntries', []);
      var qe = queueEntries.find(function(q) { return q.queueEntryId === qeId; });
      if (!qe) return;

      global.ClinicalEngine.saveConsultationRecord({
        appointmentId: qe.appointmentId,
        queueEntryId: qeId,
        doctorId: qe.doctorId,
        patientId: qe.patientId,
        chiefComplaint: 'Routine cardiology evaluation',
        diagnosis: 'Cardiovascular health within normal limits',
        prescriptions: ['Multi-vitamin 1 tablet daily', 'Low-sodium diet recommendation'],
        testsOrdered: ['ECG Follow-up']
      });

      if (global.ModalEngine) {
        global.ModalEngine.alert('Consultation Completed', 'Visit record and prescriptions saved to patient wallet!', 'success');
      }
      this.renderDoctorDashboardView();
    },

    renderLiveQueueView: function() {
      var pid = global.AuthEngine.getCurrentPatientId();
      var queueEntries = global.StorageEngine.getItem('queueEntries', []);
      var doctors = global.StorageEngine.getItem('doctors', []);
      var depts = global.StorageEngine.getItem('departments', []);

      var myEntry = queueEntries.find(function(q) { return q.patientId === pid && (q.state === 'WAITING' || q.state === 'CALLED' || q.state === 'IN_CONSULTATION'); });

      var container = document.getElementById('patient-live-queue-card');
      if (!container) return;

      if (!myEntry) {
        container.innerHTML = '<div class="glass-card"><p>You do not currently have an active queue token. Check in for a confirmed appointment to receive your live token.</p></div>';
        return;
      }

      var doc = doctors.find(function(d) { return d.doctorId === myEntry.doctorId; });
      var dept = depts.find(function(dp) { return dp.departmentId === myEntry.departmentId; });

      var block = myEntry.block || (doc ? doc.block : (dept ? dept.block : 'Block A (East Wing)'));
      var floor = myEntry.floor || (doc ? doc.floor : (dept ? dept.floor : 'Floor 3'));
      var room = myEntry.roomName || (doc ? doc.roomName : (myEntry.roomId ? myEntry.roomId.replace('rm_', 'Room ') : 'Room 304'));

      var estWait = global.QueueEngine.calculateWaitTime(myEntry.queueEntryId);
      container.innerHTML = '<div class="now-serving-box"><p>YOUR LIVE QUEUE TOKEN</p><div class="token-display-number">' + myEntry.token + '</div><p class="token-room-number">Status: ' + myEntry.state + '</p><div style="background:rgba(255,255,255,0.18); padding:16px; border-radius:var(--radius-md); margin:18px 0; text-align:left; font-size:1.05rem; line-height:1.6;"><div>🏢 <strong>Building Block:</strong> ' + block + '</div><div>🛗 <strong>Floor Level:</strong> ' + floor + '</div><div>🚪 <strong>Consult Room:</strong> ' + room + '</div></div><div style="margin-top:12px; font-size:1.15rem; color:#e0f2fe;">Estimated Wait Duration: <strong>' + estWait + ' minutes</strong></div></div>';
    },

    renderPublicTVView: function() {
      var queueEntries = global.StorageEngine.getItem('queueEntries', []);
      var active = queueEntries.filter(function(q) { return q.state === 'CALLED' || q.state === 'IN_CONSULTATION' || q.state === 'WAITING'; });

      var container = document.getElementById('public-tv-grid');
      if (!container) return;

      var html = '';
      active.forEach(function(q) {
        html += '<div class="glass-card text-center" style="background:#ffffff; border-color:var(--accent-blue);"><div style="font-size:2.6rem; font-weight:900; color:var(--accent-blue);">' + q.token + '</div><div style="font-size:1.1rem; margin-top:6px; font-weight:700;">Room ' + q.roomId.replace('rm_', '') + '</div><span class="badge badge-' + q.state.toLowerCase() + '" style="margin-top:12px;">' + q.state + '</span></div>';
      });
      container.innerHTML = html || '<p style="color:var(--text-muted);">No active queue tokens in waiting area.</p>';
    },

    renderAdminDashboardView: function() {
      var depts = global.StorageEngine.getItem('departments', []);
      var docs = global.StorageEngine.getItem('doctors', []);
      var apts = global.StorageEngine.getItem('appointments', []);
      var qe = global.StorageEngine.getItem('queueEntries', []);

      var statsContainer = document.getElementById('admin-stats');
      if (statsContainer) {
        statsContainer.innerHTML = '<div class="grid-4"><div class="glass-card"><h4>Departments</h4><h2>' + depts.length + '</h2></div><div class="glass-card"><h4>Doctors</h4><h2>' + docs.length + '</h2></div><div class="glass-card"><h4>Appointments</h4><h2>' + apts.length + '</h2></div><div class="glass-card"><h4>Active Tokens</h4><h2>' + qe.length + '</h2></div></div>';
      }
    },

    renderAuditLogsView: function() {
      var logs = global.AuditEngine ? global.AuditEngine.getLogs() : [];
      var container = document.getElementById('audit-logs-rows');
      if (!container) return;

      var html = '';
      logs.forEach(function(l) {
        html += '<tr><td>' + new Date(l.timestamp).toLocaleTimeString() + '</td><td><span class="badge badge-confirmed">' + l.actorRole + '</span></td><td><strong>' + l.actionType + '</strong></td><td>' + l.details + '</td></tr>';
      });
      container.innerHTML = html || '<tr><td colspan="4">No audit events recorded.</td></tr>';
    },

    resetAllDemoData: function() {
      if (global.ModalEngine) {
        global.ModalEngine.confirm('Reset Demo Database', 'Are you sure you want to reset all prototype demo data back to clean factory state?', function() {
          if (global.StorageEngine) global.StorageEngine.resetDemoData();
          global.ModalEngine.alert('Reset Complete', 'Demo database has been reset to factory state.', 'success', function() {
            window.location.hash = '#home';
            window.location.reload();
          });
        });
      }
    }
  };

  global.App = App;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { App.init(); });
  } else {
    App.init();
  }

})(typeof window !== 'undefined' ? window : this);
