/* ==========================================================================
   POWERED SMART HOSPITAL (PSH) - VECTOR SVG CHART ENGINE (SCANDINAVIAN THEME)
   ========================================================================== */

(function(global) {
  'use strict';

  var ChartEngine = {
    // Render Animated SVG Bar Chart (Appointments by Department)
    renderBarChart: function(container, options) {
      if (typeof container === 'string') {
        container = document.getElementById(container);
      }
      if (!container) return;

      var labels = options.labels || ['Cardiology', 'Orthopedics', 'Pediatrics', 'General', 'ENT', 'Dental'];
      var data = options.data || [78, 55, 64, 90, 40, 47];
      var title = options.title || 'Appointments by Department';

      var width = container.clientWidth || 540;
      var height = options.height || 300;
      var padding = { top: 40, right: 30, bottom: 50, left: 30 };

      var chartW = width - padding.left - padding.right;
      var chartH = height - padding.top - padding.bottom;

      var maxVal = Math.max.apply(null, data.concat([100]));
      maxVal = Math.ceil(maxVal / 10) * 10;

      var barGap = 16;
      var totalGaps = (data.length - 1) * barGap;
      var barWidth = Math.max(28, Math.floor((chartW - totalGaps) / data.length));

      var svgHtml = '<svg class="chart-svg" width="100%" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" xmlns="http://www.w3.org/2000/svg">' +
        '<defs>' +
          '<linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#5F705C"/>' +
            '<stop offset="100%" stop-color="#6E7A55"/>' +
          '</linearGradient>' +
        '</defs>';

      // X-Axis Baseline
      var baselineY = height - padding.bottom;
      svgHtml += '<line x1="' + padding.left + '" y1="' + baselineY + '" x2="' + (width - padding.right) + '" y2="' + baselineY + '" stroke="#E6DFD3" stroke-width="2"/>';

      // Bars & Labels
      for (var i = 0; i < data.length; i++) {
        var val = data[i];
        var lbl = labels[i];
        var valHeight = (val / maxVal) * chartH;
        var x = padding.left + i * (barWidth + barGap);
        var y = baselineY - valHeight;

        // Bar Rectangle
        svgHtml += '<rect class="chart-bar-rect" x="' + x + '" y="' + y + '" width="' + barWidth + '" height="' + valHeight + '" rx="6" fill="url(#barGrad)">' +
          '<title>' + lbl + ': ' + val + ' appointments</title>' +
        '</rect>';

        // Numerical Value Label on Top of Bar
        svgHtml += '<text class="chart-value-text" x="' + (x + barWidth / 2) + '" y="' + (y - 8) + '" text-anchor="middle" font-weight="700" font-size="13" fill="#2C352E">' + val + '</text>';

        // X-Axis Category Label
        svgHtml += '<text class="chart-axis-text" x="' + (x + barWidth / 2) + '" y="' + (baselineY + 24) + '" text-anchor="middle" font-weight="600" font-size="11" fill="#6B6055">' + lbl + '</text>';
      }

      svgHtml += '</svg>';
      container.innerHTML = svgHtml;
    },

    // Render Animated SVG Line Chart (Weekly Average Queue Length)
    renderLineChart: function(container, options) {
      if (typeof container === 'string') {
        container = document.getElementById(container);
      }
      if (!container) return;

      var labels = options.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      var data = options.data || [30, 42, 38, 55, 47, 33, 25];

      var width = container.clientWidth || 540;
      var height = options.height || 300;
      var padding = { top: 40, right: 35, bottom: 50, left: 35 };

      var chartW = width - padding.left - padding.right;
      var chartH = height - padding.top - padding.bottom;

      var maxVal = Math.max.apply(null, data.concat([60]));
      var minVal = Math.min.apply(null, data.concat([0]));

      var stepX = chartW / (data.length - 1);
      var points = [];

      var baselineY = height - padding.bottom;

      for (var i = 0; i < data.length; i++) {
        var x = padding.left + i * stepX;
        var y = baselineY - ((data[i] - minVal) / (maxVal - minVal || 1)) * chartH;
        points.push({ x: x, y: y, val: data[i], label: labels[i] });
      }

      var pathD = 'M ' + points.map(function(p) { return p.x + ',' + p.y; }).join(' L ');

      var svgHtml = '<svg class="chart-svg" width="100%" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" xmlns="http://www.w3.org/2000/svg">';

      // X-Axis Baseline
      svgHtml += '<line x1="' + padding.left + '" y1="' + baselineY + '" x2="' + (width - padding.right) + '" y2="' + baselineY + '" stroke="#E6DFD3" stroke-width="2"/>';

      // Line Path
      svgHtml += '<path d="' + pathD + '" fill="none" stroke="#6E7A55" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';

      // Data Points & Labels
      for (var j = 0; j < points.length; j++) {
        var pt = points[j];

        svgHtml += '<circle class="chart-line-point-outer" cx="' + pt.x + '" cy="' + pt.y + '" r="6" fill="#6E7A55"/>';
        svgHtml += '<circle class="chart-line-point-inner" cx="' + pt.x + '" cy="' + pt.y + '" r="2.5" fill="#FAF8F3"/>';

        // Value text above point
        svgHtml += '<text class="chart-value-text" x="' + pt.x + '" y="' + (pt.y - 10) + '" text-anchor="middle" font-weight="700" font-size="12" fill="#6E7A55">' + pt.val + '</text>';

        // X-Axis Day Label
        svgHtml += '<text class="chart-axis-text" x="' + pt.x + '" y="' + (baselineY + 24) + '" text-anchor="middle" font-weight="600" font-size="11" fill="#6B6055">' + pt.label + '</text>';
      }

      svgHtml += '</svg>';
      container.innerHTML = svgHtml;
    },

    // Render Hourly OPD Heatmap Distribution
    renderHourlyHeatmap: function(container, options) {
      if (typeof container === 'string') {
        container = document.getElementById(container);
      }
      if (!container) return;

      var hours = options.hours || ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
      var loads = options.loads || [12, 28, 45, 52, 38, 20, 34, 42, 31, 15];

      var html = '<div class="heatmap-container" style="display: flex; gap: 8px; flex-wrap: wrap;">';
      var max = Math.max.apply(null, loads);

      for (var i = 0; i < hours.length; i++) {
        var ratio = loads[i] / max;
        var bg = 'rgba(95, 112, 92, ' + (0.12 + ratio * 0.78) + ')';
        var textColor = ratio > 0.6 ? '#FFFFFF' : '#2C352E';

        html += '<div style="flex: 1; min-width: 80px; background: ' + bg + '; color: ' + textColor + '; padding: 12px 8px; border-radius: 10px; text-align: center; font-weight: 700; font-size: 0.82rem; transition: transform 0.2s ease;" class="heatmap-cell">' +
          '<div>' + hours[i] + '</div>' +
          '<div style="font-size: 1.05rem; margin-top: 4px;">' + loads[i] + ' <span style="font-size: 0.7rem; opacity: 0.8;">pts</span></div>' +
        '</div>';
      }

      html += '</div>';
      container.innerHTML = html;
    }
  };

  global.ChartEngine = ChartEngine;

})(typeof window !== 'undefined' ? window : this);
