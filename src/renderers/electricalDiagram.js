/* -------------------------------------------------------
   electricalDiagram.js – render electrical wiring diagram
   Supports 3 layouts: horizontal-tree, vertical-tree, compact-grid
------------------------------------------------------- */
import { createSvg, g, rect, line, text, polyline } from './svgUtils.js';
import { drawPowerSupply, drawBreaker, drawGround, drawElectricalBox } from './icons.js';

/**
 * @param {object} config
 * @param {string} layout – 'horizontal-tree' | 'vertical-tree' | 'compact-grid'
 */
export function renderElectricalDiagram(config, layout = 'horizontal-tree') {
    switch (layout) {
        case 'vertical-tree': return renderVerticalElectrical(config);
        case 'compact-grid': return renderGridElectrical(config);
        default: return renderHorizontalElectrical(config);
    }
}

/* ======================== Shared ======================== */
function drawPowerChain(svg, x, startY, powerLabel) {
    let py = startY;
    drawPowerSupply(svg, x, py, 'Fuente alim');
    text(svg, x + 20, py + 10, powerLabel, { fontSize: 10, fill: '#333' });
    py += 35;
    line(svg, x, py - 10, x, py + 5, { stroke: '#333', strokeWidth: 1.5 });
    drawBreaker(svg, x, py + 15, 'Diferencial');
    py += 40;
    line(svg, x, py - 10, x, py + 5, { stroke: '#333', strokeWidth: 1.5 });
    drawBreaker(svg, x, py + 15, 'Magnetotermico');
    py += 45;
    line(svg, x, py - 10, x, py + 5, { stroke: '#333', strokeWidth: 1.5 });
    return py;
}

function drawOutdoorBox(svg, x, y, outdoor, addr) {
    const w = 80, h = 55;
    rect(svg, x, y, w, h, { fill: '#f0f4ff', stroke: '#333', strokeWidth: 1.5 });
    text(svg, x + w / 2, y + 18, addr.phase || '123N', { fontSize: 12, fill: '#333', anchor: 'middle', fontWeight: '600' });
    text(svg, x + w / 2, y + 34, addr.out || 'Out00', { fontSize: 10, fill: '#333', anchor: 'middle' });
    text(svg, x + w / 2, y + 48, addr.code || 'AB', { fontSize: 10, fill: '#333', anchor: 'middle' });
    text(svg, x + w + 10, y + 30, outdoor.model || 'FDC140KXZEN1-W', { fontSize: 11, fill: '#333', fontWeight: '500' });
    return { x, y, w, h };
}


/* ======================== LAYOUT 1: Horizontal (original) ======================== */
function renderHorizontalElectrical(config) {
    const units = config.indoor || [], electrical = config.electrical || {}, outdoor = config.outdoor || {};
    const n = units.length;
    const boxW = 70, boxSpacing = 90;
    const svgW = Math.max(800, 200 + n * boxSpacing + 100), svgH = 600;
    const svg = createSvg(svgW, svgH);
    rect(svg, 0, 0, svgW, svgH, { fill: '#ffffff', stroke: 'none' });

    const centerX = 160;
    const py = drawPowerChain(svg, centerX, 40, electrical.power_supply || '1 Fase 220-240 v');

    // Secondary power supply for indoor
    const leftX = 40;
    let py2 = 140;
    drawPowerSupply(svg, leftX, py2, 'Fuente alim');
    text(svg, leftX + 20, py2 + 10, electrical.power_supply || '1 Fase 220-240 v', { fontSize: 10, fill: '#333' });
    py2 += 35;
    line(svg, leftX, py2 - 10, leftX, py2 + 5, { stroke: '#333', strokeWidth: 1.5 });
    drawBreaker(svg, leftX, py2 + 15, 'Diferencial Interruptor');
    py2 += 40;
    line(svg, leftX, py2 - 10, leftX, py2 + 5, { stroke: '#333', strokeWidth: 1.5 });
    drawBreaker(svg, leftX, py2 + 15, 'Magnetotermico');
    py2 += 40;
    drawGround(svg, leftX, py2 + 5);

    const ouBox = drawOutdoorBox(svg, centerX - 40, py + 15, outdoor, electrical.outdoor_address || {});

    const busY = ouBox.y + ouBox.h + 30, busStartX = 100, busEndX = busStartX + n * boxSpacing;
    line(svg, ouBox.x + ouBox.w / 2, ouBox.y + ouBox.h, ouBox.x + ouBox.w / 2, busY, { stroke: '#cc0000', strokeWidth: 1, strokeDash: '4,3' });
    line(svg, busStartX, busY, busEndX, busY, { stroke: '#cc0000', strokeWidth: 1, strokeDash: '4,3' });

    const powerBusY = busY + 15;
    line(svg, leftX, py2, leftX, powerBusY, { stroke: '#1565c0', strokeWidth: 2 });
    line(svg, leftX, powerBusY, busEndX, powerBusY, { stroke: '#1565c0', strokeWidth: 2 });

    const unitRowY = busY + 50;
    const addresses = electrical.indoor_addresses || [];
    units.forEach((u, i) => {
        const bx = busStartX + i * boxSpacing, by = unitRowY;
        const addr = addresses[i] || { phase: '12', code: 'AB', outAddr: 'Out00', inAddr: `In ${String(i).padStart(2, '0')}` };
        line(svg, bx + boxW / 2, busY, bx + boxW / 2, by, { stroke: '#cc0000', strokeWidth: 1, strokeDash: '4,3' });
        line(svg, bx + boxW / 2 + 5, powerBusY, bx + boxW / 2 + 5, by, { stroke: '#1565c0', strokeWidth: 2 });
        drawElectricalBox(svg, bx, by, addr);
        drawGround(svg, bx + boxW / 2, by + 65);
        text(svg, bx + boxW / 2 - 3, by + 85, 'R', { fontSize: 10, fill: '#333', fontWeight: '600' });
        text(svg, bx + boxW / 2, by + 110, `${u.index}.`, { fontSize: 10, fill: '#333', anchor: 'middle' });
        text(svg, bx + boxW / 2, by + 124, u.model, { fontSize: 7, fill: '#333', anchor: 'middle' });
    });

    if (n > 0) {
        const scX = busStartX + n * boxSpacing + 20;
        rect(svg, scX, unitRowY, 55, 35, { fill: '#fff', stroke: '#999' });
        text(svg, scX + 27, unitRowY + 22, 'SC-SL4-AE', { fontSize: 8, fill: '#333', anchor: 'middle' });
        line(svg, scX + 27, busY, scX + 27, unitRowY, { stroke: '#cc0000', strokeWidth: 1, strokeDash: '4,3' });
    }
    return svg;
}


/* ======================== LAYOUT 2: Vertical Column ======================== */
function renderVerticalElectrical(config) {
    const units = config.indoor || [], electrical = config.electrical || {}, outdoor = config.outdoor || {};
    const n = units.length;
    const boxW = 70, unitSpacing = 100;
    const svgW = 600, svgH = Math.max(600, 350 + n * unitSpacing + 80);
    const svg = createSvg(svgW, svgH);
    rect(svg, 0, 0, svgW, svgH, { fill: '#ffffff', stroke: 'none' });

    const centerX = 120;
    const py = drawPowerChain(svg, centerX, 30, electrical.power_supply || '1 Fase 220-240 v');
    const ouBox = drawOutdoorBox(svg, centerX - 40, py + 15, outdoor, electrical.outdoor_address || {});

    // Indoor units in a vertical column to the right
    const busX = centerX + 140;
    const busStartY = ouBox.y;
    const busEndY = ouBox.y + n * unitSpacing;

    // Comm bus horizontal from outdoor then vertical
    line(svg, ouBox.x + ouBox.w, ouBox.y + ouBox.h / 2, busX, ouBox.y + ouBox.h / 2, { stroke: '#cc0000', strokeWidth: 1, strokeDash: '4,3' });
    line(svg, busX, busStartY, busX, busEndY + 60, { stroke: '#cc0000', strokeWidth: 1, strokeDash: '4,3' });

    // Power bus
    const powerBusX = busX + 8;
    line(svg, ouBox.x + ouBox.w, ouBox.y + ouBox.h / 2 + 6, powerBusX, ouBox.y + ouBox.h / 2 + 6, { stroke: '#1565c0', strokeWidth: 2 });
    line(svg, powerBusX, busStartY, powerBusX, busEndY + 60, { stroke: '#1565c0', strokeWidth: 2 });

    text(svg, ouBox.x + ouBox.w + 10, ouBox.y + ouBox.h + 12, outdoor.model || 'FDC140KXZEN1-W', { fontSize: 9, fill: '#333' });

    const addresses = electrical.indoor_addresses || [];
    units.forEach((u, i) => {
        const bx = busX + 30;
        const by = busStartY + i * unitSpacing;
        const addr = addresses[i] || { phase: '12', code: 'AB', outAddr: 'Out00', inAddr: `In ${String(i).padStart(2, '0')}` };

        // Horizontal branch from buses
        line(svg, busX, by + 30, bx, by + 30, { stroke: '#cc0000', strokeWidth: 1, strokeDash: '4,3' });
        line(svg, powerBusX, by + 36, bx, by + 36, { stroke: '#1565c0', strokeWidth: 2 });

        drawElectricalBox(svg, bx, by, addr);
        drawGround(svg, bx + boxW / 2, by + 65);
        text(svg, bx + boxW + 8, by + 30, `${u.index}. ${u.model}`, { fontSize: 8, fill: '#333' });
    });

    return svg;
}


/* ======================== LAYOUT 3: Two-Row Grid ======================== */
function renderGridElectrical(config) {
    const units = config.indoor || [], electrical = config.electrical || {}, outdoor = config.outdoor || {};
    const n = units.length;
    const boxW = 70, boxH = 60;
    const COLS = Math.min(n, Math.max(2, Math.ceil(n / 2)));
    const ROWS = Math.ceil(n / COLS);
    const cellW = 100, cellH = 140;

    const svgW = Math.max(700, 180 + COLS * cellW + 40);
    const svgH = Math.max(550, 300 + ROWS * cellH + 40);
    const svg = createSvg(svgW, svgH);
    rect(svg, 0, 0, svgW, svgH, { fill: '#ffffff', stroke: 'none' });

    const centerX = 120;
    const py = drawPowerChain(svg, centerX, 30, electrical.power_supply || '1 Fase 220-240 v');
    const ouBox = drawOutdoorBox(svg, centerX - 40, py + 15, outdoor, electrical.outdoor_address || {});

    // Grid of units below
    const gridStartX = 60;
    const gridStartY = ouBox.y + ouBox.h + 70;

    // Distribution buses
    const busY = ouBox.y + ouBox.h + 25;
    line(svg, ouBox.x + ouBox.w / 2, ouBox.y + ouBox.h, ouBox.x + ouBox.w / 2, busY, { stroke: '#cc0000', strokeWidth: 1, strokeDash: '4,3' });
    line(svg, gridStartX, busY, gridStartX + COLS * cellW, busY, { stroke: '#cc0000', strokeWidth: 1, strokeDash: '4,3' });
    line(svg, gridStartX, busY + 10, gridStartX + COLS * cellW, busY + 10, { stroke: '#1565c0', strokeWidth: 2 });

    const addresses = electrical.indoor_addresses || [];
    units.forEach((u, i) => {
        const col = i % COLS, row = Math.floor(i / COLS);
        const bx = gridStartX + col * cellW + (cellW - boxW) / 2;
        const by = gridStartY + row * cellH;
        const addr = addresses[i] || { phase: '12', code: 'AB', outAddr: 'Out00', inAddr: `In ${String(i).padStart(2, '0')}` };

        const cx = bx + boxW / 2;
        // Drop from bus
        line(svg, cx, busY, cx, by, { stroke: '#cc0000', strokeWidth: 1, strokeDash: '4,3' });
        line(svg, cx + 5, busY + 10, cx + 5, by, { stroke: '#1565c0', strokeWidth: 1.5 });

        drawElectricalBox(svg, bx, by, addr);
        drawGround(svg, bx + boxW / 2, by + boxH + 5);
        text(svg, bx + boxW / 2, by + boxH + 30, `${u.index}.`, { fontSize: 9, fill: '#333', anchor: 'middle' });
        text(svg, bx + boxW / 2, by + boxH + 42, u.model, { fontSize: 6, fill: '#333', anchor: 'middle' });
    });

    return svg;
}
