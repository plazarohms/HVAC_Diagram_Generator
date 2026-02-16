/* -------------------------------------------------------
   daikinDiagram.js – Daikin VRV / Sky Air style
   Vertical schematic, blue color scheme, dual-line piping,
   REFNET Y-branch joints, summary table at bottom.
   Supports multiple outdoor units (systems).
------------------------------------------------------- */
import { createSvg, g, rect, line, text, path, circle } from './svgUtils.js';
import { drawOutdoorUnit, drawIndoorUnit } from './icons.js';

export function renderDaikinDiagram(config) {
    var systems = config.systems || [{ outdoor: config.outdoor, indoor: config.indoor, piping: config.piping }];
    var project = config.project || {};
    var allUnits = config.indoor || [];
    var totalUnits = allUnits.length;

    var COL_W = 140;
    var maxN = 0;
    for (var si = 0; si < systems.length; si++) {
        if (systems[si].indoor.length > maxN) maxN = systems[si].indoor.length;
    }

    var sectionH = 380;
    var tableRowH = 18;
    var tableH = tableRowH * (totalUnits + 2) + 30;

    var contentW = Math.max(maxN * COL_W, 400);
    var svgW = contentW + 160;
    var svgH = 50 + systems.length * (sectionH + 40) + tableH + 40;
    var svg = createSvg(svgW, svgH);
    rect(svg, 0, 0, svgW, svgH, { fill: '#f8fbff', stroke: 'none' });

    // ---- Header ----
    rect(svg, 0, 0, svgW, 38, { fill: '#00838f', stroke: 'none' });
    text(svg, 20, 15, 'DAIKIN', { fontSize: 14, fill: '#fff', fontWeight: '800' });
    text(svg, 20, 28, 'VRV / Sky Air  |  Piping Diagram', { fontSize: 8, fill: '#b2ebf2' });
    text(svg, svgW - 20, 15, project.name || 'HVAC PROJECT', { fontSize: 10, fill: '#fff', anchor: 'end', fontWeight: '600' });
    text(svg, svgW - 20, 28, 'Systems: ' + systems.length + '  |  Units: ' + totalUnits, { fontSize: 8, fill: '#b2ebf2', anchor: 'end' });

    // ---- Legend ----
    line(svg, 30, 52, 50, 52, { stroke: '#1565c0', strokeWidth: 2.5 });
    text(svg, 55, 55, 'Gas pipe', { fontSize: 8, fill: '#1565c0' });
    line(svg, 120, 52, 140, 52, { stroke: '#e65100', strokeWidth: 1.5 });
    text(svg, 145, 55, 'Liquid pipe', { fontSize: 8, fill: '#e65100' });

    var yOffset = 68;

    for (var si = 0; si < systems.length; si++) {
        var sys = systems[si];
        var sysUnits = sys.indoor || [];
        var piping = sys.piping || {};
        var outdoor = sys.outdoor || {};
        var n = sysUnits.length;
        if (n === 0) continue;

        var flatUnits = flattenTree(piping, 0);
        if (flatUnits.length === 0) {
            for (var i = 0; i < sysUnits.length; i++) {
                flatUnits.push({ unit: sysUnits[i], gasSize: '3/8"', liquidSize: '1/4"', distance: 5.0, depth: 1 });
            }
        }

        // Compute centered unit X positions
        var totalUnitW = n * COL_W;
        var startX = (svgW - totalUnitW) / 2;
        var unitCenterXs = [];
        for (var i = 0; i < n; i++) {
            unitCenterXs.push(startX + i * COL_W + COL_W / 2);
        }
        var centerX = svgW / 2;

        // System label
        if (systems.length > 1) {
            text(svg, centerX, yOffset + 10, 'System ' + (si + 1), { fontSize: 10, fill: '#00838f', anchor: 'middle', fontWeight: '700' });
            yOffset += 18;
        }

        // ---- Outdoor unit (top center) ----
        var ouX = centerX - 50, ouY = yOffset;
        drawOutdoorUnit(svg, ouX, ouY, outdoor.model);
        text(svg, centerX, ouY + 92, outdoor.model || '', { fontSize: 9, fill: '#00838f', anchor: 'middle', fontWeight: '700' });

        // Capacity badge
        var capBW = 140;
        rect(svg, centerX - capBW / 2, ouY + 98, capBW, 18, { fill: '#e0f7fa', stroke: '#00838f', strokeWidth: 0.6 });
        text(svg, centerX, ouY + 110, (sys.totalCooling || 0) + ' kW cool  |  ' + (sys.totalHeating || 0) + ' kW heat', { fontSize: 7, fill: '#00695c', anchor: 'middle', fontWeight: '500' });

        // ---- Dual-line trunk (from outdoor down) ----
        var trunkTopY = ouY + 82;
        var trunkBotY = trunkTopY + 40;
        line(svg, centerX - 3, trunkTopY, centerX - 3, trunkBotY, { stroke: '#1565c0', strokeWidth: 2.5 });
        line(svg, centerX + 3, trunkTopY, centerX + 3, trunkBotY, { stroke: '#e65100', strokeWidth: 1.5 });

        // ---- REFNET joint symbol ----
        circle(svg, centerX, trunkBotY, 5, { fill: '#00838f', stroke: '#004d40', strokeWidth: 1.5 });
        text(svg, centerX + 12, trunkBotY + 4, 'REFNET', { fontSize: 7, fill: '#00695c', fontWeight: '500' });

        // ---- Horizontal distribution line ----
        var distLineY = trunkBotY + 25;
        var distLeft = unitCenterXs[0];
        var distRight = unitCenterXs[n - 1];

        // Gas line (blue)
        line(svg, distLeft, distLineY - 2, distRight, distLineY - 2, { stroke: '#1565c0', strokeWidth: 2 });
        // Liquid line (orange)
        line(svg, distLeft, distLineY + 2, distRight, distLineY + 2, { stroke: '#e65100', strokeWidth: 1.2 });

        // Connect REFNET to distribution
        line(svg, centerX - 3, trunkBotY + 5, centerX - 3, distLineY - 2, { stroke: '#1565c0', strokeWidth: 2 });
        line(svg, centerX + 3, trunkBotY + 5, centerX + 3, distLineY + 2, { stroke: '#e65100', strokeWidth: 1.2 });

        // ---- Indoor units (below distribution) ----
        var unitY = distLineY + 50;

        for (var i = 0; i < flatUnits.length; i++) {
            var u = flatUnits[i].unit;
            var cx = unitCenterXs[i];

            // Branch dot
            circle(svg, cx, distLineY, 3.5, { fill: '#00838f', stroke: '#004d40', strokeWidth: 1 });

            // Dual drop pipes
            line(svg, cx - 3, distLineY + 4, cx - 3, unitY - 5, { stroke: '#1565c0', strokeWidth: 1.5 });
            line(svg, cx + 3, distLineY + 4, cx + 3, unitY - 5, { stroke: '#e65100', strokeWidth: 1 });

            // Pipe labels (centered between dist and unit)
            var labelY = (distLineY + unitY) / 2;
            text(svg, cx + 10, labelY - 4, flatUnits[i].gasSize || '', { fontSize: 7, fill: '#1565c0' });
            text(svg, cx + 10, labelY + 8, flatUnits[i].liquidSize || '', { fontSize: 7, fill: '#e65100' });

            // ---- Unit box ----
            var boxW = COL_W - 20;
            var boxH = 55;
            var bx = cx - boxW / 2;
            var by = unitY;

            rect(svg, bx, by, boxW, boxH, { fill: '#fff', stroke: '#37474f', strokeWidth: 1 });

            // Unit number badge (top-right corner)
            rect(svg, bx + boxW - 22, by + 2, 20, 16, { fill: '#00838f', stroke: 'none' });
            text(svg, bx + boxW - 12, by + 14, String(u.index), { fontSize: 10, fill: '#fff', anchor: 'middle', fontWeight: '700' });

            // Icon (left side)
            drawIndoorUnit(svg, bx + 5, by + 5, u.type || 'ducted');

            // Capacity (below icon in box)
            text(svg, cx, by + boxH - 10, (u.cooling_kw || 0) + '/' + (u.heating_kw || 0) + ' kW', { fontSize: 7, fill: '#37474f', anchor: 'middle' });

            // Model below box
            text(svg, cx, by + boxH + 12, u.model || '', { fontSize: 7, fill: '#37474f', anchor: 'middle', fontWeight: '600' });
            // Room
            text(svg, cx, by + boxH + 24, u.room || '', { fontSize: 7, fill: '#00838f', anchor: 'middle' });
            // Distance
            text(svg, cx, by + boxH + 35, (flatUnits[i].distance || 0) + ' m', { fontSize: 7, fill: '#999', anchor: 'middle' });
        }

        yOffset += sectionH;
        if (si < systems.length - 1) {
            line(svg, 30, yOffset - 10, svgW - 30, yOffset - 10, { stroke: '#00838f', strokeWidth: 0.8, strokeDash: '6,4' });
        }
    }

    // =============== SUMMARY TABLE ===============
    var tableY = yOffset;
    var colWidths = [40, 50, 120, 70, 70, 70, 120];
    var tableW = 0;
    for (var c = 0; c < colWidths.length; c++) tableW += colWidths[c];
    var tableX = (svgW - tableW) / 2;

    // Header
    rect(svg, tableX, tableY, tableW, tableRowH, { fill: '#00838f', stroke: '#004d40' });
    var headers = ['Sys', '#', 'Model', 'Type', 'Cool kW', 'Heat kW', 'Room'];
    var cx = tableX;
    for (var hi = 0; hi < headers.length; hi++) {
        text(svg, cx + colWidths[hi] / 2, tableY + 13, headers[hi], { fontSize: 8, fill: '#fff', anchor: 'middle', fontWeight: '600' });
        cx += colWidths[hi];
    }

    // Rows
    var rowIdx = 0;
    for (var si = 0; si < systems.length; si++) {
        var sysU = systems[si].indoor || [];
        for (var i = 0; i < sysU.length; i++) {
            var u = sysU[i];
            var ry = tableY + tableRowH + rowIdx * tableRowH;
            rect(svg, tableX, ry, tableW, tableRowH, { fill: rowIdx % 2 === 0 ? '#f5f5f5' : '#ffffff', stroke: '#e0e0e0' });
            var rowData = [String(si + 1), String(u.index), u.model || '', u.type || '', String(u.cooling_kw || 0), String(u.heating_kw || 0), u.room || ''];
            var rx = tableX;
            for (var ci = 0; ci < rowData.length; ci++) {
                text(svg, rx + colWidths[ci] / 2, ry + 13, rowData[ci], { fontSize: 7, fill: '#333', anchor: 'middle' });
                rx += colWidths[ci];
            }
            rowIdx++;
        }
    }

    // Footer
    var footY = tableY + tableRowH + rowIdx * tableRowH;
    rect(svg, tableX, footY, tableW, tableRowH, { fill: '#e0f7fa', stroke: '#00838f' });
    text(svg, tableX + colWidths[0] / 2, footY + 13, 'Total', { fontSize: 8, fill: '#00838f', anchor: 'middle', fontWeight: '600' });
    var footX = tableX;
    for (var fi = 0; fi < 4; fi++) footX += colWidths[fi];
    text(svg, footX + colWidths[4] / 2, footY + 13, (project.totalCooling || 0) + ' kW', { fontSize: 8, fill: '#1565c0', anchor: 'middle', fontWeight: '600' });
    text(svg, footX + colWidths[4] + colWidths[5] / 2, footY + 13, (project.totalHeating || 0) + ' kW', { fontSize: 8, fill: '#e65100', anchor: 'middle', fontWeight: '600' });
    text(svg, footX + colWidths[4] + colWidths[5] + colWidths[6] / 2, footY + 13, totalUnits + ' units', { fontSize: 8, fill: '#00838f', anchor: 'middle', fontWeight: '600' });

    // Adjust SVG
    var finalH = footY + tableRowH + 30;
    if (finalH > svgH) {
        svg.setAttribute('height', finalH);
        svg.setAttribute('viewBox', '0 0 ' + svgW + ' ' + finalH);
    }

    return svg;
}

function flattenTree(node, depth) {
    if (!node) return [];
    depth = depth || 0;
    if (node.unit) return [{ unit: node.unit, gasSize: node.gasSize || '', liquidSize: node.liquidSize || '', distance: node.distance || 0, depth: depth }];
    if (node.children) {
        var result = [];
        for (var i = 0; i < node.children.length; i++) result = result.concat(flattenTree(node.children[i], depth + 1));
        return result;
    }
    return [];
}
