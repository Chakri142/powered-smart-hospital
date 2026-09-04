/* ==========================================================================
   POWERED SMART HOSPITAL (PSH) - INTELLIGENT CLINICAL ENGINES
   ========================================================================== */

(function(global) {
  'use strict';

  var AiEngine = {
    // ----------------------------------------------------------------------
    // 1. HOSPITAL FLOW RADAR ENGINE
    // ----------------------------------------------------------------------
    getHospitalFlowData: function() {
      var queueEntries = global.StorageEngine ? global.StorageEngine.getItem('queueEntries', []) : [];
      var departments = global.StorageEngine ? global.StorageEngine.getItem('departments', []) : [];
      var doctors = global.StorageEngine ? global.StorageEngine.getItem('doctors', []) : [];

      var blocks = [
        { id: 'Block A', name: 'Block A — OPD & Primary Care' },
        { id: 'Block B', name: 'Block B — Neuro & Digestive Health' },
        { id: 'Block C', name: 'Block C — Pediatrics & Dialysis' },
        { id: 'Block D', name: 'Block D — Oncology & Emergency ER' }
      ];

      var deptTelemetry = departments.map(function(dept) {
        var deptDocs = doctors.filter(function(d) { return d.departmentId === dept.departmentId; });
        var activeDocs = deptDocs.filter(function(d) {
          return !d.status || d.status === 'ON_DUTY' || d.status === 'ACTIVE' || d.status === 'AVAILABLE';
        });

        var deptQueue = queueEntries.filter(function(q) {
          var qDoc = doctors.find(function(doc) { return doc.doctorId === q.doctorId; });
          var matchDept = q.departmentId === dept.departmentId || (qDoc && qDoc.departmentId === dept.departmentId);
          return matchDept && (q.state === 'WAITING' || q.state === 'CALLED' || q.state === 'IN_CONSULTATION');
        });

        var waitingCount = deptQueue.filter(function(q) { return q.state === 'WAITING'; }).length;
        var inConsultCount = deptQueue.filter(function(q) { return q.state === 'CALLED' || q.state === 'IN_CONSULTATION'; }).length;
        var urgentCount = deptQueue.filter(function(q) { return q.priority === 'EMERGENCY' || q.priority === 'PRIORITY_ASSIST'; }).length;
        
        // Calculate Status Indicator
        var status = 'NORMAL'; // NORMAL, MODERATE, CONGESTED, EMERGENCY, UNAVAILABLE
        var statusLabel = '🟢 Normal';
        var statusClass = 'radar-status-normal';

        if (deptDocs.length === 0 || activeDocs.length === 0) {
          status = 'UNAVAILABLE';
          statusLabel = '🔵 Doctor Unavailable';
          statusClass = 'radar-status-unavailable';
        } else if (urgentCount > 0) {
          status = 'EMERGENCY';
          statusLabel = '⚠️ Emergency Priority';
          statusClass = 'radar-status-emergency';
        } else if (waitingCount + inConsultCount > 10) {
          status = 'CONGESTED';
          statusLabel = '🔴 Congested';
          statusClass = 'radar-status-congested';
        } else if (waitingCount + inConsultCount >= 1 || inConsultCount > 0) {
          status = 'MODERATE';
          statusLabel = '🟡 Active Consultation';
          statusClass = 'radar-status-moderate';
        }

        // Estimated wait calculation
        var avgMins = deptDocs.length > 0 ? (deptDocs[0].avgConsultMins || 15) : 15;
        var estWaitMins = Math.max(0, Math.ceil((waitingCount * avgMins) / Math.max(1, activeDocs.length)));

        var roomDisplay = dept.rooms || (deptDocs.length > 0 ? (deptDocs[0].roomName || deptDocs[0].roomId.replace('rm_', 'Room ')) : 'Room 101');

        return {
          departmentId: dept.departmentId,
          name: dept.name,
          code: dept.code,
          location: dept.location || 'Block A, Floor 1',
          room: roomDisplay,
          waitingCount: waitingCount + inConsultCount,
          urgentCount: urgentCount,
          activeDocsCount: activeDocs.length,
          totalDocsCount: deptDocs.length > 0 ? deptDocs.length : 1,
          status: status,
          statusLabel: statusLabel,
          statusClass: statusClass,
          estWaitMins: estWaitMins
        };
      });

      return {
        blocks: blocks,
        departments: deptTelemetry
      };
    },

    renderFlowRadar: function(containerId, filterBlock) {
      var container = document.getElementById(containerId);
      if (!container) return;

      var flowData = this.getHospitalFlowData();
      var filteredDepts = flowData.departments;

      if (filterBlock && filterBlock !== 'ALL') {
        filteredDepts = filteredDepts.filter(function(d) { return d.location.indexOf(filterBlock) !== -1; });
      }

      var html = '<div class="radar-map-wrapper">';

      // Horizontal Block Connectivity Connector Bar
      html += '<div class="radar-blocks-bar">';
      flowData.blocks.forEach(function(b, idx) {
        var bDepts = flowData.departments.filter(function(d) { return d.location.indexOf(b.id) !== -1; });
        var hasEmergency = bDepts.some(function(d) { return d.status === 'EMERGENCY'; });
        var isCongested = bDepts.some(function(d) { return d.status === 'CONGESTED'; });

        var pillClass = hasEmergency ? 'radar-block-emergency' : (isCongested ? 'radar-block-congested' : 'radar-block-normal');

        html += '<div class="radar-block-pill ' + pillClass + '">';
        html += '<span class="radar-block-name">' + b.id + '</span>';
        html += '<span class="radar-block-sub">' + bDepts.length + ' Depts</span>';
        html += '</div>';

        if (idx < flowData.blocks.length - 1) {
          html += '<div class="radar-connector-line">➜</div>';
        }
      });
      html += '</div>';

      // Department Telemetry Cards Grid
      html += '<div class="radar-grid">';
      filteredDepts.forEach(function(d) {
        html += '<div class="radar-dept-card ' + d.statusClass + '">';
        html += '  <div class="radar-dept-header">';
        html += '    <div>';
        html += '      <h4 class="radar-dept-name">' + d.name + '</h4>';
        html += '      <p class="radar-dept-loc">📍 ' + d.location + ' • ' + d.room + '</p>';
        html += '    </div>';
        html += '    <span class="radar-status-badge">' + d.statusLabel + '</span>';
        html += '  </div>';

        html += '  <div class="radar-dept-stats">';
        html += '    <div class="radar-stat"><span class="radar-stat-val">' + d.waitingCount + '</span><span class="radar-stat-lbl">Waiting</span></div>';
        html += '    <div class="radar-stat"><span class="radar-stat-val text-emergency">' + d.urgentCount + '</span><span class="radar-stat-lbl">Urgent</span></div>';
        html += '    <div class="radar-stat"><span class="radar-stat-val">' + d.estWaitMins + 'm</span><span class="radar-stat-lbl">Est. Wait</span></div>';
        html += '    <div class="radar-stat"><span class="radar-stat-val">' + d.activeDocsCount + '/' + d.totalDocsCount + '</span><span class="radar-stat-lbl">Doctors</span></div>';
        html += '  </div>';
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';

      container.innerHTML = html;
    },

    // ----------------------------------------------------------------------
    // 2. SMART PATIENT ROUTING ENGINE (WAYPOINT JOURNEY NAVIGATOR)
    // ----------------------------------------------------------------------
    generatePatientRoute: function(patientId) {
      var appointments = global.StorageEngine ? global.StorageEngine.getItem('appointments', []) : [];
      var queueEntries = global.StorageEngine ? global.StorageEngine.getItem('queueEntries', []) : [];
      var departments = global.StorageEngine ? global.StorageEngine.getItem('departments', []) : [];
      var doctors = global.StorageEngine ? global.StorageEngine.getItem('doctors', []) : [];

      var patientApt = appointments.find(function(a) { return a.patientId === patientId && a.status !== 'CANCELLED'; });
      var token = queueEntries.find(function(q) { return q.patientId === patientId && q.state !== 'COMPLETED'; });

      var dept = patientApt ? departments.find(function(d) { return d.departmentId === patientApt.departmentId; }) : departments[0];
      var doc = patientApt ? doctors.find(function(d) { return d.doctorId === patientApt.doctorId; }) : doctors[0];

      var locStr = dept ? (dept.location || 'Block A, Floor 3') : 'Block A, Floor 3';
      var block = locStr.indexOf('Block') !== -1 ? locStr.split(',')[0].trim() : 'Block A';
      var floor = locStr.indexOf('Floor') !== -1 ? locStr.split(',')[1].trim() : 'Floor 3';
      var room = doc ? (doc.roomId || 'Room 304') : 'Room 304';
      var deptName = dept ? dept.name : 'Cardiology';

      // Current state step index
      var currentStepIndex = 1;
      if (token) {
        if (token.state === 'WAITING') currentStepIndex = 3;
        else if (token.state === 'CALLED') currentStepIndex = 5;
        else if (token.state === 'IN_CONSULTATION') currentStepIndex = 6;
      }

      var waypoints = [
        { step: 1, title: 'Main Entrance', desc: 'Arrive at Hospital Main Gate & Security Check', icon: '🏛️' },
        { step: 2, title: 'Reception Desk', desc: 'Check in or scan QR code at Central Front Desk', icon: '📋' },
        { step: 3, title: 'Triage Station', desc: 'Vitals assessment & Queue Token check-in', icon: '🩺' },
        { step: 4, title: block, desc: 'Follow Green Line signage to ' + block, icon: '🏢' },
        { step: 5, title: floor, desc: 'Take Elevator / Stairs to ' + floor, icon: '🛗' },
        { step: 6, title: room, desc: 'Wait in Lounge outside ' + room, icon: '🚪' },
        { step: 7, title: deptName + ' Consultation', desc: 'In Consultation with ' + (doc ? doc.name : 'Doctor'), icon: '👨‍⚕️' }
      ];

      return {
        patientId: patientId,
        tokenNumber: token ? token.token : (patientApt ? 'CARD-001' : 'PID-1001'),
        currentStepIndex: currentStepIndex,
        waypoints: waypoints
      };
    },

    renderPatientRoute: function(containerId, patientId) {
      var container = document.getElementById(containerId);
      if (!container) return;

      var routeData = this.generatePatientRoute(patientId || 'PID-2026-1001');

      var html = '<div class="route-navigator-card">';
      html += '<div class="route-header">';
      html += '  <div>';
      html += '    <h3 class="route-title">🧭 Smart Patient Route Navigator</h3>';
      html += '    <p class="route-sub">Live step-by-step physical journey for Token <strong>' + routeData.tokenNumber + '</strong></p>';
      html += '  </div>';
      html += '  <span class="badge badge-submitted">Step ' + routeData.currentStepIndex + ' of 7 Active</span>';
      html += '</div>';

      html += '<div class="route-waypoints-timeline">';
      routeData.waypoints.forEach(function(w) {
        var isCompleted = w.step < routeData.currentStepIndex;
        var isActive = w.step === routeData.currentStepIndex;
        var stepClass = isCompleted ? 'step-completed' : (isActive ? 'step-active' : 'step-pending');

        html += '<div class="route-waypoint-item ' + stepClass + '">';
        html += '  <div class="waypoint-marker">' + w.icon + '</div>';
        html += '  <div class="waypoint-content">';
        html += '    <div class="waypoint-title">' + w.step + '. ' + w.title + '</div>';
        html += '    <div class="waypoint-desc">' + w.desc + '</div>';
        html += '  </div>';
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';

      container.innerHTML = html;
    },

    // ----------------------------------------------------------------------
    // 3. PREDICTIVE WAITING-TIME ENGINE
    // ----------------------------------------------------------------------
    calculatePredictiveWait: function(queueEntryId) {
      var queueEntries = global.StorageEngine ? global.StorageEngine.getItem('queueEntries', []) : [];
      var doctors = global.StorageEngine ? global.StorageEngine.getItem('doctors', []) : [];

      var target = queueEntries.find(function(q) { return q.queueEntryId === queueEntryId; });
      if (!target || target.state !== 'WAITING') {
        return { mins: 0, confidence: 'High (100%)', ahead: 0, speed: 15, delay: 0 };
      }

      var deptQueue = queueEntries.filter(function(q) {
        return q.departmentId === target.departmentId && (q.state === 'WAITING' || q.state === 'CALLED');
      });

      // Priority sort
      var priorityRank = { 'EMERGENCY': 1, 'PRIORITY_ASSIST': 2, 'STANDARD': 3 };
      deptQueue.sort(function(a, b) {
        var rA = priorityRank[a.priority] || 3;
        var rB = priorityRank[b.priority] || 3;
        if (rA !== rB) return rA - rB;
        return new Date(a.admittedAt) - new Date(b.admittedAt);
      });

      var posAhead = 0;
      for (var i = 0; i < deptQueue.length; i++) {
        if (deptQueue[i].queueEntryId === target.queueEntryId) break;
        posAhead++;
      }

      var doc = doctors.find(function(d) { return d.doctorId === target.doctorId; });
      var speed = doc ? (doc.avgConsultMins || 12) : 12;

      // Department load delay factor
      var delayFactor = Math.floor(deptQueue.length / 4) * 2;

      // Priority discount offset
      var priorityDiscount = target.priority === 'EMERGENCY' ? 12 : (target.priority === 'PRIORITY_ASSIST' ? 5 : 0);

      var predictedMins = Math.max(2, (posAhead * speed) + delayFactor - priorityDiscount);

      // Confidence score calculation
      var confidence = 'High (94%)';
      if (posAhead > 8) confidence = 'Medium (81%)';
      if (posAhead > 15) confidence = 'Moderate (68%)';

      return {
        mins: predictedMins,
        confidence: confidence,
        ahead: posAhead,
        speed: speed,
        delay: delayFactor
      };
    },

    // ----------------------------------------------------------------------
    // 4. AI QUEUE BALANCER & WORKLOAD OPTIMIZER
    // ----------------------------------------------------------------------
    getQueueBalanceProposals: function() {
      var queueEntries = global.StorageEngine ? global.StorageEngine.getItem('queueEntries', []) : [];
      var doctors = global.StorageEngine ? global.StorageEngine.getItem('doctors', []) : [];
      var departments = global.StorageEngine ? global.StorageEngine.getItem('departments', []) : [];

      var proposals = [];

      // Scan doctor load imbalances per department
      departments.forEach(function(dept) {
        var deptDocs = doctors.filter(function(d) { return d.departmentId === dept.departmentId; });
        if (deptDocs.length < 2) return;

        var docLoads = deptDocs.map(function(doc) {
          var waiting = queueEntries.filter(function(q) {
            return q.doctorId === doc.doctorId && q.state === 'WAITING';
          });
          return { doctor: doc, count: waiting.length, queue: waiting };
        });

        docLoads.sort(function(a, b) { return b.count - a.count; });

        var busiest = docLoads[0];
        var lightest = docLoads[docLoads.length - 1];

        // Imbalance threshold: diff >= 2
        if (busiest.count - lightest.count >= 2) {
          var transferableCount = Math.floor((busiest.count - lightest.count) / 2);
          var estSavingsMins = transferableCount * (busiest.doctor.avgConsultMins || 12);

          proposals.push({
            proposalId: 'prop_' + dept.departmentId + '_' + Date.now(),
            type: 'DOCTOR_REBALANCE',
            departmentId: dept.departmentId,
            departmentName: dept.name,
            fromDoctorId: busiest.doctor.doctorId,
            fromDoctorName: busiest.doctor.name,
            toDoctorId: lightest.doctor.doctorId,
            toDoctorName: lightest.doctor.name,
            transferCount: transferableCount,
            savingsMins: estSavingsMins,
            title: '⚡ Queue Imbalance Detected in ' + dept.name,
            description: busiest.doctor.name + ' has ' + busiest.count + ' waiting patients while ' + lightest.doctor.name + ' has ' + lightest.count + '.',
            actionLabel: 'Apply AI Rebalance (' + transferableCount + ' Patients ➜ ' + lightest.doctor.name + ')'
          });
        }
      });

      // Default synthetic proposal if all perfectly balanced
      if (proposals.length === 0) {
        proposals.push({
          proposalId: 'prop_opt_card',
          type: 'OPTIMAL_FLOW',
          departmentName: 'Cardiology & OPD',
          title: '✨ AI Flow Optimizer Active',
          description: 'All clinical queues are currently balanced within optimal thresholds.',
          actionLabel: 'Re-scan Telemetry',
          transferCount: 0,
          savingsMins: 0
        });
      }

      return proposals;
    },

    executeRebalanceProposal: function(proposalId) {
      var proposals = this.getQueueBalanceProposals();
      var prop = proposals.find(function(p) { return p.proposalId === proposalId || p.type === 'DOCTOR_REBALANCE'; });

      if (!prop || prop.transferCount === 0) {
        if (global.NotificationsEngine) {
          global.NotificationsEngine.showToast('AI Queue Balancer', 'Queues are already optimally balanced.', 'info');
        }
        return false;
      }

      var queueEntries = global.StorageEngine.getItem('queueEntries', []);
      var fromQueue = queueEntries.filter(function(q) {
        return q.doctorId === prop.fromDoctorId && q.state === 'WAITING' && q.priority === 'STANDARD';
      });

      var transferred = 0;
      for (var i = fromQueue.length - 1; i >= 0 && transferred < prop.transferCount; i--) {
        fromQueue[i].doctorId = prop.toDoctorId;
        transferred++;
      }

      global.StorageEngine.setItem('queueEntries', queueEntries);

      if (global.AuditEngine) {
        global.AuditEngine.log('AI_QUEUE_REBALANCED', 'AI Balancer moved ' + transferred + ' patients from ' + prop.fromDoctorName + ' to ' + prop.toDoctorName, 'AI_ENGINE');
      }

      if (global.NotificationsEngine) {
        global.NotificationsEngine.showToast('AI Load Rebalance Applied', 'Reallocated ' + transferred + ' patient tokens to ' + prop.toDoctorName + '. Expected wait reduced by ' + prop.savingsMins + ' min.', 'success');
      }

      return true;
    },

    renderQueueBalancerWidget: function(containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;

      var proposals = this.getQueueBalanceProposals();
      var html = '<div class="balancer-card">';
      html += '<div class="balancer-header">';
      html += '  <div>';
      html += '    <h3 class="balancer-title">🤖 AI Queue Balancer & Workload Optimizer</h3>';
      html += '    <p class="balancer-sub">Real-time decision support for department load leveling</p>';
      html += '  </div>';
      html += '  <span class="badge badge-submitted">Live Decision Support</span>';
      html += '</div>';

      html += '<div class="balancer-body">';
      proposals.forEach(function(p) {
        html += '<div class="balancer-proposal-item">';
        html += '  <div class="proposal-title-block">';
        html += '    <h4 class="proposal-title">' + p.title + '</h4>';
        html += '    <p class="proposal-desc">' + p.description + '</p>';
        html += '  </div>';
        if (p.transferCount > 0) {
          html += '  <button onclick="AiEngine.executeRebalanceProposal(\'' + p.proposalId + '\'); AiEngine.renderQueueBalancerWidget(\'' + containerId + '\'); if (window.App && window.App.renderAdminDashboard) window.App.renderAdminDashboard();" class="btn btn-primary btn-sm">' + p.actionLabel + '</button>';
        } else {
          html += '  <span class="badge badge-confirmed">Optimal Balance</span>';
        }
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';

      container.innerHTML = html;
    }
  };

  global.AiEngine = AiEngine;

})(typeof window !== 'undefined' ? window : this);
