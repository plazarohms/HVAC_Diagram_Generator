/* -------------------------------------------------------
   mitsubishiDiagram.js – Mitsubishi e-Solution style
   Horizontal tree: outdoor left → joints → indoor units right
   Supports multiple outdoor units (systems)
------------------------------------------------------- */
import { createSvg, g, rect, line, text, path, circle } from './svgUtils.js';
import { drawOutdoorUnit, drawIndoorUnit, drawRemote } from './icons.js';

export function renderMitsubishiDiagram(config) {
    var systems = config.systems || [{ outdoor: config.outdoor, indoor: config.indoor, piping: config.piping }];
    var project = config.project || {};
    var totalUnits = (config.indoor || []).length;

    // Calculate total height needed
    var ROW_H = 140;
    var MARGIN = 40;
    var TOP = 70;
    var systemHeights = [];
    var totalH = TOP;

    for (var si = 0; si < systems.length; si++) {
        var sysN = systems[si].indoor.length;
        var h = Math.max(200, sysN * ROW_H + 60);
        systemHeights.push(h);
        totalH += h + (si < systems.length - 1 ? 30 : 0);
    }
    totalH += 40;

    var svgW = 1100;
    var svgH = Math.max(600, totalH);
    var svg = createSvg(svgW, svgH);
    rect(svg, 0, 0, svgW, svgH, { fill: '#ffffff', stroke: 'none' });

    // ---- Header ----
    var hg = g(svg, 'translate(' + MARGIN + ',10)');
    rect(hg, 0, 0, 220, 14, { fill: '#cc0000', stroke: 'none' });
    text(hg, 4, 10, 'MITSUBISHI', { fontSize: 8, fill: '#fff', fontWeight: '700' });
    text(hg, 60, 10, 'Creado por Mitsubishi Heavy Industries Air-Conditioning Europe, Ltd.', { fontSize: 5, fill: '#fff' });
    rect(hg, 0, 16, 90, 12, { fill: '#003399', stroke: 'none' });
    text(hg, 4, 25, 'e-solution', { fontSize: 8, fill: '#fff', fontWeight: '600' });

    // ---- Project info box ----
    var ig = g(svg, 'translate(' + (svgW - 440) + ',10)');
    var infoLines = [
        ['Proyecto', project.name || 'HVAC PROJECT'],
        ['Sistema', project.system || 'UE1'],
        ['Condiciones de dise\u00f1o', project.designConditions || ''],
        ['Tirada total de tuber\u00eda', (project.totalPipeLength || 0) + ' m  de  ' + (project.maxPipeLength || 0) + ' m'],
        ['Unidades interiores', String(totalUnits)],
        ['Capacidad en fr\u00edo total', (project.totalCooling || 0) + ' kW / ' + (project.totalHeating || 0) + ' kW'],
        ['Factor diversidad', project.diversityFactor || '0%'],
        ['Refrigerante total', (project.totalRefrigerant || 0) + ' kg'],
    ];
    for (var ii = 0; ii < infoLines.length; ii++) {
        text(ig, 0, ii * 14, infoLines[ii][0] + ' : ', { fontSize: 9, fill: '#333' });
        text(ig, 170, ii * 14, infoLines[ii][1], { fontSize: 9, fill: ii === 0 ? '#003399' : '#333', fontWeight: ii === 0 ? '700' : '400' });
    }

    // ---- Draw each system ----
    var yOffset = TOP;
    for (var si = 0; si < systems.length; si++) {
        var sys = systems[si];
        var sysUnits = sys.indoor || [];
        var sysN = sysUnits.length;
        var piping = sys.piping || {};
        var outdoor = sys.outdoor || {};

        // System separator
        if (si > 0) {
            line(svg, MARGIN, yOffset - 15, svgW - MARGIN, yOffset - 15, { stroke: '#ddd', strokeWidth: 1, strokeDash: '8,4' });
        }

        // System label
        text(svg, MARGIN, yOffset + 12, 'System ' + (si + 1) + '  —  ' + (outdoor.model || ''), {
            fontSize: 10, fill: '#003399', fontWeight: '600',
        });

        // Outdoor unit
        var ouX = MARGIN, ouY = yOffset + 25;
        drawOutdoorUnit(svg, ouX, ouY, outdoor.model);
        text(svg, ouX + 50, ouY + 100, outdoor.model || '', { fontSize: 9, fill: '#003399', anchor: 'middle', fontWeight: '600' });

        // Flatten + positions
        var flatUnits = flattenTree(piping, 0);
        if (flatUnits.length === 0) {
            for (var fi = 0; fi < sysUnits.length; fi++) {
                flatUnits.push({ unit: sysUnits[fi], gasSize: '3/8"', liquidSize: '1/4"', distance: 5.0, depth: 1 });
            }
        }

        var pipeX = ouX + 103;
        var pipeY = ouY + 35;
        var unitX = svgW - 250;
        var positions = [];
        for (var i = 0; i < flatUnits.length; i++) {
            positions.push({ x: unitX, y: yOffset + 25 + i * ROW_H });
        }

        // Joint X positions
        var maxDepth = 0;
        for (var i = 0; i < flatUnits.length; i++) {
            if (flatUnits[i].depth > maxDepth) maxDepth = flatUnits[i].depth;
        }
        var depthSpacing = Math.min(120, (unitX - pipeX - 80) / Math.max(maxDepth + 1, 2));
        var jointXPositions = [];
        for (var d = 0; d <= maxDepth + 1; d++) {
            jointXPositions.push(pipeX + 60 + d * depthSpacing);
        }

        // Recursive tree drawing
        var currentUnitIdx = 0;

        function drawNode(node, fromX, fromY, depth) {
            if (!node) return fromY;

            if (node.unit) {
                var ui = currentUnitIdx;
                if (ui >= positions.length) return fromY;
                var uy = positions[ui].y + 25;
                var ux = positions[ui].x;

                line(svg, fromX, fromY, ux - 10, fromY, { stroke: '#333', strokeWidth: 1.2 });
                text(svg, fromX + 15, fromY - 8, (node.gasSize || '') + ', ' + (node.liquidSize || ''), { fontSize: 8, fill: '#333' });
                text(svg, fromX + 15, fromY + 12, (node.distance || 0) + 'm', { fontSize: 8, fill: '#009900', fontWeight: '500' });

                if (Math.abs(fromY - uy) > 3) {
                    line(svg, ux - 10, fromY, ux - 10, uy, { stroke: '#333', strokeWidth: 1.2 });
                    line(svg, ux - 10, uy, ux, uy, { stroke: '#333', strokeWidth: 1.2 });
                }

                // Unit block
                rect(svg, ux - 10, positions[ui].y - 35, 190, 110, { fill: 'none', stroke: '#999', strokeWidth: 0.6, strokeDash: '4,3' });
                text(svg, ux, positions[ui].y - 20, (node.unit.cooling_kw || 0) + ' kW/' + (node.unit.heating_kw || 0) + ' kW', { fontSize: 9, fill: '#006600', fontWeight: '600' });
                text(svg, ux, positions[ui].y - 8, node.unit.index + '. ' + (node.unit.model || ''), { fontSize: 8, fill: '#0066cc', fontWeight: '500' });
                text(svg, ux + 125, positions[ui].y - 20, '0.00 kW/0.00 kW', { fontSize: 8, fill: '#0066cc' });
                drawIndoorUnit(svg, ux + 30, positions[ui].y, node.unit.type || 'ducted');
                text(svg, ux + 56, positions[ui].y + 62, (node.unit.room || '') + ' ' + (node.unit.location || ''), { fontSize: 9, fill: '#003399', anchor: 'middle', fontWeight: '600' });
                drawRemote(svg, ux + 195, positions[ui].y + 5, node.unit.remote || 'RC-EX3A');

                currentUnitIdx++;
                return uy;
            }

            if (node.children && node.children.length > 0) {
                var jx = jointXPositions[Math.min(depth, jointXPositions.length - 1)];
                line(svg, fromX, fromY, jx, fromY, { stroke: '#333', strokeWidth: 1.2 });
                text(svg, fromX + 8, fromY - 8, (node.gasSize || '') + ', ' + (node.liquidSize || ''), { fontSize: 8, fill: '#333' });
                text(svg, fromX + 8, fromY + 12, (node.distance || 0) + 'm', { fontSize: 8, fill: '#009900', fontWeight: '500' });

                circle(svg, jx, fromY, 3, { fill: '#333', stroke: '#333' });
                text(svg, jx + 5, fromY - 8, node.joint || '', { fontSize: 7, fill: '#333' });

                drawNode(node.children[0], jx + 10, fromY, depth + 1);

                for (var ci = 1; ci < node.children.length; ci++) {
                    if (currentUnitIdx < positions.length) {
                        var nextY = positions[currentUnitIdx].y + 25;
                        line(svg, jx, fromY, jx, nextY, { stroke: '#333', strokeWidth: 1.2 });
                        drawNode(node.children[ci], jx + 10, nextY, depth + 1);
                    }
                }
            }
            return fromY;
        }

        drawNode(piping, pipeX, pipeY, 0);
        yOffset += systemHeights[si] + 30;
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
