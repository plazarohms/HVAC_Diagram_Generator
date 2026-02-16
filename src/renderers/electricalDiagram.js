/* -------------------------------------------------------
   electricalDiagram.js – render electrical wiring diagram
   Layout: power supply top → breakers → outdoor unit → indoor units row
------------------------------------------------------- */
import { createSvg, g, rect, line, text, polyline } from './svgUtils.js';
import {
    drawPowerSupply, drawBreaker, drawGround, drawElectricalBox,
} from './icons.js';

export function renderElectricalDiagram(config) {
    const units = config.indoor || [];
    const electrical = config.electrical || {};
    const outdoor = config.outdoor || {};
    const n = units.length;

    const boxW = 70;
    const boxSpacing = 90;
    const svgW = Math.max(800, 200 + n * boxSpacing + 100);
    const svgH = 600;
    const svg = createSvg(svgW, svgH);

    rect(svg, 0, 0, svgW, svgH, { fill: '#ffffff', stroke: 'none' });

    const centerX = 160;

    // ====== Power supply 1 (for outdoor unit) ======
    let py = 40;
    drawPowerSupply(svg, centerX, py, 'Fuente alim');
    text(svg, centerX + 20, py + 10, electrical.power_supply || '1 Fase 220-240 v', { fontSize: 10, fill: '#333' });
    py += 35;

    // Vertical line down from power supply
    line(svg, centerX, py - 10, centerX, py + 5, { stroke: '#333', strokeWidth: 1.5 });

    // Breaker 1 - Differential
    drawBreaker(svg, centerX, py + 15, 'Diferencial');
    py += 40;
    line(svg, centerX, py - 10, centerX, py + 5, { stroke: '#333', strokeWidth: 1.5 });

    // Breaker 2 - Magnetothermic
    drawBreaker(svg, centerX, py + 15, 'Magnetotermico');
    py += 45;
    line(svg, centerX, py - 10, centerX, py + 5, { stroke: '#333', strokeWidth: 1.5 });

    // ====== Power supply 2 (for indoor units) ======
    let py2 = 140;
    const leftX = 40;
    drawPowerSupply(svg, leftX, py2, 'Fuente alim');
    text(svg, leftX + 20, py2 + 10, electrical.power_supply || '1 Fase 220-240 v', { fontSize: 10, fill: '#333' });
    py2 += 35;
    line(svg, leftX, py2 - 10, leftX, py2 + 5, { stroke: '#333', strokeWidth: 1.5 });
    drawBreaker(svg, leftX, py2 + 15, 'Diferencial Interruptor');
    py2 += 40;
    line(svg, leftX, py2 - 10, leftX, py2 + 5, { stroke: '#333', strokeWidth: 1.5 });
    drawBreaker(svg, leftX, py2 + 15, 'Magnetotermico');
    py2 += 40;

    // Ground symbol for indoor supply
    drawGround(svg, leftX, py2 + 5);

    // ====== Outdoor unit box ======
    const ouBoxX = centerX - 40;
    const ouBoxY = py + 15;
    const ouBoxW = 80;
    const ouBoxH = 55;
    rect(svg, ouBoxX, ouBoxY, ouBoxW, ouBoxH, { fill: '#f0f4ff', stroke: '#333', strokeWidth: 1.5 });

    // Phase address info
    const ouAddr = electrical.outdoor_address || {};
    text(svg, ouBoxX + ouBoxW / 2, ouBoxY + 18, ouAddr.phase || '123N', {
        fontSize: 12, fill: '#333', anchor: 'middle', fontWeight: '600',
    });
    text(svg, ouBoxX + ouBoxW / 2, ouBoxY + 34, ouAddr.out || 'Out00', {
        fontSize: 10, fill: '#333', anchor: 'middle',
    });
    text(svg, ouBoxX + ouBoxW / 2, ouBoxY + 48, ouAddr.code || 'AB', {
        fontSize: 10, fill: '#333', anchor: 'middle',
    });
    // Model label right
    text(svg, ouBoxX + ouBoxW + 10, ouBoxY + 30, outdoor.model || 'FDC140KXZEN1-W', {
        fontSize: 11, fill: '#333', fontWeight: '500',
    });

    // ====== Communication bus (dashed red) & power (solid blue) ======
    const busY = ouBoxY + ouBoxH + 30;
    const busStartX = 100;
    const busEndX = busStartX + n * boxSpacing;

    // Red dashed communication line
    line(svg, ouBoxX + ouBoxW / 2, ouBoxY + ouBoxH, ouBoxX + ouBoxW / 2, busY, {
        stroke: '#cc0000', strokeWidth: 1, strokeDash: '4,3',
    });
    line(svg, busStartX, busY, busEndX, busY, {
        stroke: '#cc0000', strokeWidth: 1, strokeDash: '4,3',
    });

    // Blue power line
    const powerBusY = busY + 15;
    line(svg, leftX, py2, leftX, powerBusY, { stroke: '#1565c0', strokeWidth: 2 });
    line(svg, leftX, powerBusY, busEndX, powerBusY, { stroke: '#1565c0', strokeWidth: 2 });

    // ====== Indoor unit boxes ======
    const unitRowY = busY + 50;
    const addresses = electrical.indoor_addresses || [];

    units.forEach((u, i) => {
        const bx = busStartX + i * boxSpacing;
        const by = unitRowY;
        const addr = addresses[i] || {
            phase: '12', code: 'AB',
            outAddr: 'Out00', inAddr: `In ${String(i).padStart(2, '0')}`,
        };

        // Connection lines (dashed red from comm bus, solid blue from power bus)
        // Red comm drop
        line(svg, bx + boxW / 2, busY, bx + boxW / 2, by, {
            stroke: '#cc0000', strokeWidth: 1, strokeDash: '4,3',
        });
        // Blue power drop
        line(svg, bx + boxW / 2 + 5, powerBusY, bx + boxW / 2 + 5, by, {
            stroke: '#1565c0', strokeWidth: 2,
        });

        // Draw box
        drawElectricalBox(svg, bx, by, addr);

        // Ground symbol below box
        drawGround(svg, bx + boxW / 2, by + 65);

        // "R" symbol (relay)
        text(svg, bx + boxW / 2 - 3, by + 85, 'R', { fontSize: 10, fill: '#333', fontWeight: '600' });

        // Unit number & model below
        text(svg, bx + boxW / 2, by + 110, `${u.index}.`, { fontSize: 10, fill: '#333', anchor: 'middle' });
        text(svg, bx + boxW / 2, by + 124, u.model, { fontSize: 7, fill: '#333', anchor: 'middle' });
    });

    // Optional: SC-SL4-AE controller box
    if (n > 0) {
        const scX = busStartX + n * boxSpacing + 20;
        const scY = unitRowY;
        rect(svg, scX, scY, 55, 35, { fill: '#fff', stroke: '#999' });
        text(svg, scX + 27, scY + 22, 'SC-SL4-AE', { fontSize: 8, fill: '#333', anchor: 'middle' });
        // Connection from bus
        line(svg, scX + 27, busY, scX + 27, scY, { stroke: '#cc0000', strokeWidth: 1, strokeDash: '4,3' });
    }

    return svg;
}
