/* -------------------------------------------------------
   panasonicDiagram.js – Panasonic-style piping diagram
   Matches Panasonic reference: green lines, U1/U2 above,
   C/X below, R1/R2, outdoor unit bottom-left,
   title block bottom-right.
   Supports multiple outdoor units (systems).
------------------------------------------------------- */
import { createSvg, g, rect, line, text, path, circle } from './svgUtils.js';
import { drawOutdoorUnit, drawIndoorUnit } from './icons.js';

var GREEN = '#009900';
var DARK_GREEN = '#006600';
var LIGHT_GREEN = '#e8f5e9';

export function renderPanasonicDiagram(config) {
    var systems = config.systems || [{ outdoor: config.outdoor, indoor: config.indoor, piping: config.piping }];
    var project = config.project || {};
    var totalUnits = (config.indoor || []).length;

    // Column sizing
    var COL_W = 150;
    var MARGIN_L = 50;
    var PIPE_TOP = 40;

    // For multi-system: stack vertically
    var sysBlockH = 360;
    var maxN = 0;
    for (var si = 0; si < systems.length; si++) {
        if (systems[si].indoor.length > maxN) maxN = systems[si].indoor.length;
    }

    var outdoorW = 130;
    var contentW = MARGIN_L + outdoorW + 30 + maxN * COL_W + 30;
    var titleBlockW = 360;
    var svgW = Math.max(contentW + titleBlockW + 30, 1000);
    var svgH = 20 + systems.length * (sysBlockH + 20) + 20;
    var svg = createSvg(svgW, svgH);
    rect(svg, 0, 0, svgW, svgH, { fill: '#ffffff', stroke: 'none' });

    var yOffset = 15;

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
                flatUnits.push({ unit: sysUnits[i], gasSize: '3/8"', liquidSize: '1/4"', distance: 0, depth: 1 });
            }
        }

        // X positions for indoor units (right of outdoor)
        var indoorStartX = MARGIN_L + outdoorW + 30;
        var unitCenterXs = [];
        for (var i = 0; i < n; i++) {
            unitCenterXs.push(indoorStartX + i * COL_W + COL_W / 2);
        }

        // Key Y positions
        var pipeY = yOffset + PIPE_TOP;
        var u1u2Y = pipeY + 25;
        var unitIconY = u1u2Y + 25;
        var cxY = unitIconY + 65;
        var modelY = cxY + 25;
        var r1r2Y = modelY + 18;
        var roomY = r1r2Y + 22;

        // ---- Distribution piping (horizontal green line at top) ----
        if (n > 1) {
            line(svg, unitCenterXs[0], pipeY, unitCenterXs[n - 1], pipeY, { stroke: GREEN, strokeWidth: 1.5 });
        }

        // Trunk from outdoor to distribution
        var ouCenterX = MARGIN_L + outdoorW / 2;
        var ouY = roomY + 25;

        // Vertical pipe from outdoor going up
        line(svg, ouCenterX, pipeY, ouCenterX, ouY, { stroke: GREEN, strokeWidth: 1.5 });
        // Horizontal connect to first indoor
        if (n > 0) {
            line(svg, ouCenterX, pipeY, unitCenterXs[0], pipeY, { stroke: GREEN, strokeWidth: 1.5 });
        }

        // Joint symbol at the split
        if (n > 1) {
            var jointX = (ouCenterX + unitCenterXs[0]) / 2;
            // Small triangle/arrow symbol
            path(svg, 'M' + (jointX - 4) + ',' + (pipeY - 4) + ' L' + (jointX + 4) + ',' + pipeY + ' L' + (jointX - 4) + ',' + (pipeY + 4) + ' Z', { fill: GREEN, stroke: DARK_GREEN, strokeWidth: 0.5 });
        }

        // ---- Indoor units (each column) ----
        for (var i = 0; i < flatUnits.length; i++) {
            var u = flatUnits[i].unit;
            var cx = unitCenterXs[i];
            var fl = flatUnits[i];

            // Pipe length label above
            text(svg, cx, pipeY - 8, 'L=' + (fl.distance || 0).toFixed(2) + ' m', { fontSize: 8, fill: GREEN, anchor: 'middle' });

            // Vertical pipe drop from distribution
            line(svg, cx, pipeY, cx, u1u2Y - 2, { stroke: GREEN, strokeWidth: 1.2 });

            // ---- U1 / U2 boxes ----
            var boxW = 24, boxH = 14;
            rect(svg, cx - boxW - 2, u1u2Y, boxW, boxH, { fill: '#fff', stroke: GREEN, strokeWidth: 0.8 });
            text(svg, cx - boxW / 2 - 2, u1u2Y + 10, 'U1', { fontSize: 7, fill: GREEN, anchor: 'middle', fontWeight: '600' });
            rect(svg, cx + 2, u1u2Y, boxW, boxH, { fill: '#fff', stroke: GREEN, strokeWidth: 0.8 });
            text(svg, cx + boxW / 2 + 2, u1u2Y + 10, 'U2', { fontSize: 7, fill: GREEN, anchor: 'middle', fontWeight: '600' });

            // ---- Indoor unit icon ----
            drawIndoorUnit(svg, cx - 28, unitIconY, u.type || 'ducted');

            // ---- C / X boxes ----
            rect(svg, cx - boxW - 2, cxY, boxW, boxH, { fill: '#fff', stroke: GREEN, strokeWidth: 0.8 });
            text(svg, cx - boxW / 2 - 2, cxY + 10, 'C', { fontSize: 7, fill: GREEN, anchor: 'middle', fontWeight: '600' });
            rect(svg, cx + 2, cxY, boxW, boxH, { fill: '#fff', stroke: GREEN, strokeWidth: 0.8 });
            text(svg, cx + boxW / 2 + 2, cxY + 10, 'X', { fontSize: 7, fill: GREEN, anchor: 'middle', fontWeight: '600' });

            // ---- Model name ----
            text(svg, cx, modelY, 'S-' + (u.model || '').replace(/^S-/, ''), { fontSize: 8, fill: '#333', anchor: 'middle', fontWeight: '600' });

            // ---- R1 / R2 boxes ----
            rect(svg, cx - boxW - 2, r1r2Y, boxW, boxH, { fill: '#fff', stroke: GREEN, strokeWidth: 0.8 });
            text(svg, cx - boxW / 2 - 2, r1r2Y + 10, 'R1', { fontSize: 7, fill: GREEN, anchor: 'middle', fontWeight: '600' });
            rect(svg, cx + 2, r1r2Y, boxW, boxH, { fill: '#fff', stroke: GREEN, strokeWidth: 0.8 });
            text(svg, cx + boxW / 2 + 2, r1r2Y + 10, 'R2', { fontSize: 7, fill: GREEN, anchor: 'middle', fontWeight: '600' });

            // ---- Room / location ----
            text(svg, cx, roomY, 'UI:' + (u.room || ''), { fontSize: 7, fill: '#333', anchor: 'middle' });
        }

        // ---- Outdoor unit (bottom-left) ----
        drawOutdoorUnit(svg, MARGIN_L, ouY, outdoor.model);
        text(svg, ouCenterX, ouY + 90, outdoor.model || '', { fontSize: 8, fill: '#333', anchor: 'middle', fontWeight: '600' });

        // Outdoor connector boxes: U1 U2 1 2
        var oBoxY = ouY + 96;
        var oBoxW = 20, oBoxH = 14;
        var oLabels = ['U1', 'U2', '1', '2'];
        var oStartX = ouCenterX - (oLabels.length * (oBoxW + 3)) / 2;
        for (var oi = 0; oi < oLabels.length; oi++) {
            var obx = oStartX + oi * (oBoxW + 3);
            rect(svg, obx, oBoxY, oBoxW, oBoxH, { fill: '#fff', stroke: GREEN, strokeWidth: 0.8 });
            text(svg, obx + oBoxW / 2, oBoxY + 10, oLabels[oi], { fontSize: 7, fill: GREEN, anchor: 'middle', fontWeight: '600' });
        }

        // System separator
        yOffset += sysBlockH;
        if (si < systems.length - 1) {
            yOffset += 10;
            line(svg, 10, yOffset, svgW - 10, yOffset, { stroke: GREEN, strokeWidth: 0.6, strokeDash: '6,4' });
            yOffset += 10;
        }
    }

    // ---- Title block (bottom-right) ----
    var tbW = 340, tbH = 80;
    var tbX = svgW - tbW - 15;
    var tbY = svgH - tbH - 10;
    rect(svg, tbX, tbY, tbW, tbH, { fill: '#fff', stroke: GREEN, strokeWidth: 1.5 });

    // Title block rows
    var rowH2 = 14;
    var infoLines = [
        ['PROYECTO DE EJECUCIÓN', project.name || ''],
        ['situación', project.system || 'UE1'],
        ['PROMOTOR', 'HVAC Systems'],
        ['plano', 'INSTALACIÓN DE CLIMATIZACIÓN — ESQUEMA ' + systems.length],
    ];
    for (var ri = 0; ri < infoLines.length; ri++) {
        var ry = tbY + 4 + ri * (rowH2 + 3);
        line(svg, tbX, ry + rowH2 + 1, tbX + tbW, ry + rowH2 + 1, { stroke: GREEN, strokeWidth: 0.4 });
        text(svg, tbX + 5, ry + 10, infoLines[ri][0] + ':', { fontSize: 7, fill: DARK_GREEN, fontWeight: '600' });
        text(svg, tbX + 130, ry + 10, infoLines[ri][1], { fontSize: 7, fill: '#333' });
    }

    // Capacity summary line
    text(svg, tbX + 5, tbY + tbH - 8, 'Total: ' + (project.totalCooling || 0) + ' kW / ' + (project.totalHeating || 0) + ' kW  |  ' + totalUnits + ' units  |  ' + systems.length + ' system(s)', {
        fontSize: 7, fill: DARK_GREEN, fontWeight: '500',
    });

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
