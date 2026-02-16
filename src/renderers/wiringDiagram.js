/* -------------------------------------------------------
   wiringDiagram.js – render wiring output diagram
   Supports 3 layouts: horizontal-tree, vertical-tree, compact-grid
------------------------------------------------------- */
import { createSvg, g, rect, line, text, polyline } from './svgUtils.js';
import { drawConnectorBlock, drawWiringRemote } from './icons.js';

/**
 * @param {object} config
 * @param {string} layout – 'horizontal-tree' | 'vertical-tree' | 'compact-grid'
 */
export function renderWiringDiagram(config, layout = 'horizontal-tree') {
    switch (layout) {
        case 'vertical-tree': return renderHorizontalWiring(config);
        case 'compact-grid': return renderCompactWiring(config);
        default: return renderVerticalCascade(config);
    }
}


/* ======================== LAYOUT 1: Vertical Cascade (original) ======================== */
function renderVerticalCascade(config) {
    const outputs = config.wiringOutputs || [];
    if (outputs.length === 0) return createSvg(400, 200);

    const UNIT_VGAP = 140, LEFT_MARGIN = 60;
    const totalUnits = outputs.reduce((s, o) => s + o.units.length, 0);
    const svgW = 750, svgH = Math.max(500, 120 + totalUnits * UNIT_VGAP + 60);
    const svg = createSvg(svgW, svgH);
    rect(svg, 0, 0, svgW, svgH, { fill: '#ffffff', stroke: 'none' });

    let globalY = 0;
    outputs.forEach(output => {
        const startY = globalY + 30, n = output.units.length;

        text(svg, LEFT_MARGIN, startY, `Wiring Out ${output.outputIndex}`, { fontSize: 16, fill: '#003399', fontWeight: '600' });

        const ouX = LEFT_MARGIN, ouY = startY + 30, ouW = 110, ouH = 45;
        rect(svg, ouX, ouY, ouW, ouH, { fill: '#e8eaf6', stroke: '#555', strokeWidth: 1.5 });
        for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++)
            rect(svg, ouX + ouW - 20 + c * 8, ouY + 8 + r * 8, 4, 4, { fill: '#333', stroke: 'none' });
        text(svg, ouX + 10, ouY + 20, `Out ${output.outputIndex}`, { fontSize: 9, fill: '#666' });
        text(svg, ouX + 10, ouY + 34, output.outdoorLabel || output.outdoorModel, { fontSize: 9, fill: '#333', fontWeight: '500' });
        text(svg, ouX + ouW / 2, ouY + ouH + 14, output.outdoorModel, { fontSize: 9, fill: '#333', anchor: 'middle' });
        text(svg, ouX + ouW + 15, ouY + 14, output.phase || '', { fontSize: 9, fill: '#666' });
        text(svg, ouX + 10, ouY + ouH + 28, output.connectorLabel || 'N,F1,F2', { fontSize: 9, fill: '#1565c0', fontWeight: '500' });

        const iuStartX = ouX + 200, iuStartY = ouY, bw = 90, bh = 50;

        output.units.forEach((u, ui) => {
            const ux = iuStartX + 40, uy = iuStartY + ui * UNIT_VGAP;
            if (ui === 0) {
                line(svg, ouX + ouW, ouY + ouH / 2, ux - 10, ouY + ouH / 2, { stroke: '#1565c0', strokeWidth: 2 });
                if (uy + bh / 2 > ouY + ouH / 2) line(svg, ux - 10, ouY + ouH / 2, ux - 10, uy + bh / 2, { stroke: '#1565c0', strokeWidth: 2 });
                line(svg, ux - 10, uy + bh / 2, ux, uy + bh / 2, { stroke: '#1565c0', strokeWidth: 2 });
            } else {
                const prevY = iuStartY + (ui - 1) * UNIT_VGAP + bh;
                const wireX = ux - 25;
                line(svg, wireX, prevY + 5, wireX, uy + bh / 2, { stroke: '#1565c0', strokeWidth: 2 });
                line(svg, wireX, uy + bh / 2, ux, uy + bh / 2, { stroke: '#1565c0', strokeWidth: 2 });
                rect(svg, wireX - 3, prevY + 2, 6, 6, { fill: '#1565c0', stroke: 'none' });
            }

            drawUnitBox(svg, ux, uy, bw, bh, u);
            const remX = ux + bw + 120, remY = uy + 10;
            text(svg, ux + bw + 50, uy + 5, u.wiringPhase || 'L,N 0.5A 1ph', { fontSize: 9, fill: '#666' });
            line(svg, ux + bw + 8, uy + bh / 2, remX, uy + bh / 2, { stroke: '#1565c0', strokeWidth: 1.5 });
            drawWiringRemote(svg, remX, remY, u.remote || 'BRC1H62W');
        });
        globalY += 30 + n * UNIT_VGAP + 40;
    });
    return svg;
}


/* ======================== LAYOUT 2: Horizontal Row ======================== */
function renderHorizontalWiring(config) {
    const outputs = config.wiringOutputs || [];
    if (outputs.length === 0) return createSvg(400, 200);

    const UNIT_HGAP = 160, TOP_MARGIN = 60;
    const maxUnits = Math.max(...outputs.map(o => o.units.length));
    const svgW = Math.max(800, 200 + maxUnits * UNIT_HGAP + 60);
    const svgH = Math.max(500, TOP_MARGIN + outputs.length * 320 + 40);
    const svg = createSvg(svgW, svgH);
    rect(svg, 0, 0, svgW, svgH, { fill: '#ffffff', stroke: 'none' });

    let globalY = TOP_MARGIN;
    outputs.forEach(output => {
        const n = output.units.length;
        text(svg, 40, globalY, `Wiring Out ${output.outputIndex}`, { fontSize: 16, fill: '#003399', fontWeight: '600' });

        // Outdoor unit block on the left
        const ouX = 40, ouY = globalY + 25, ouW = 110, ouH = 45;
        rect(svg, ouX, ouY, ouW, ouH, { fill: '#e8eaf6', stroke: '#555', strokeWidth: 1.5 });
        for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++)
            rect(svg, ouX + ouW - 20 + c * 8, ouY + 8 + r * 8, 4, 4, { fill: '#333', stroke: 'none' });
        text(svg, ouX + 10, ouY + 20, `Out ${output.outputIndex}`, { fontSize: 9, fill: '#666' });
        text(svg, ouX + 10, ouY + 34, output.outdoorModel, { fontSize: 9, fill: '#333', fontWeight: '500' });
        text(svg, ouX + ouW + 10, ouY + 14, output.phase || '', { fontSize: 9, fill: '#666' });

        // Horizontal bus from outdoor
        const busY = ouY + ouH / 2;
        const busStartX = ouX + ouW;
        const busEndX = busStartX + n * UNIT_HGAP;
        line(svg, busStartX, busY, busEndX, busY, { stroke: '#1565c0', strokeWidth: 2 });

        const bw = 90, bh = 50;
        output.units.forEach((u, ui) => {
            const ux = busStartX + 30 + ui * UNIT_HGAP;
            const uy = busY + 30;

            // Drop from bus
            line(svg, ux + bw / 2, busY, ux + bw / 2, uy, { stroke: '#1565c0', strokeWidth: 2 });
            rect(svg, ux + bw / 2 - 3, busY - 3, 6, 6, { fill: '#1565c0', stroke: 'none' });

            drawUnitBox(svg, ux, uy, bw, bh, u);
            text(svg, ux + bw / 2, uy + bh + 16, u.wiringPhase || 'L,N 0.5A 1ph', { fontSize: 8, fill: '#666', anchor: 'middle' });

            // Remote below
            drawWiringRemote(svg, ux + 5, uy + bh + 30, u.remote || 'BRC1H62W');
        });

        globalY += 220;
    });
    return svg;
}


/* ======================== LAYOUT 3: Compact Stacked ======================== */
function renderCompactWiring(config) {
    const outputs = config.wiringOutputs || [];
    if (outputs.length === 0) return createSvg(400, 200);

    const allUnits = outputs.flatMap(o => o.units);
    const n = allUnits.length;
    const COLS = Math.min(n, Math.max(2, Math.ceil(Math.sqrt(n))));
    const ROWS = Math.ceil(n / COLS);
    const CELL_W = 180, CELL_H = 140;

    const svgW = Math.max(700, 160 + COLS * CELL_W);
    const svgH = Math.max(500, 200 + ROWS * CELL_H + 40);
    const svg = createSvg(svgW, svgH);
    rect(svg, 0, 0, svgW, svgH, { fill: '#ffffff', stroke: 'none' });

    // Title
    const outputLabels = outputs.map(o => `Wiring Out ${o.outputIndex}`).join(' + ');
    text(svg, 40, 30, outputLabels, { fontSize: 16, fill: '#003399', fontWeight: '600' });

    // Outdoor unit at top
    const ouX = 40, ouY = 50, ouW = 110, ouH = 45;
    const firstOutput = outputs[0];
    rect(svg, ouX, ouY, ouW, ouH, { fill: '#e8eaf6', stroke: '#555', strokeWidth: 1.5 });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++)
        rect(svg, ouX + ouW - 20 + c * 8, ouY + 8 + r * 8, 4, 4, { fill: '#333', stroke: 'none' });
    text(svg, ouX + 10, ouY + 20, firstOutput.outdoorModel, { fontSize: 9, fill: '#333', fontWeight: '500' });
    text(svg, ouX + ouW + 10, ouY + 14, firstOutput.phase || '', { fontSize: 9, fill: '#666' });

    // Distribution
    const gridStartX = 60, gridStartY = ouY + ouH + 60;
    const distY = ouY + ouH + 20;
    line(svg, ouX + ouW / 2, ouY + ouH, ouX + ouW / 2, distY, { stroke: '#1565c0', strokeWidth: 2 });
    line(svg, gridStartX, distY, gridStartX + COLS * CELL_W - CELL_W / 2, distY, { stroke: '#1565c0', strokeWidth: 2 });

    const bw = 90, bh = 50;
    allUnits.forEach((u, i) => {
        const col = i % COLS, row = Math.floor(i / COLS);
        const cx = gridStartX + col * CELL_W + CELL_W / 2;
        const ux = cx - bw / 2;
        const uy = gridStartY + row * CELL_H;

        // Drop
        line(svg, cx, distY, cx, uy, { stroke: '#1565c0', strokeWidth: 1.5 });
        rect(svg, cx - 3, distY - 3, 6, 6, { fill: '#1565c0', stroke: 'none' });

        drawUnitBox(svg, ux, uy, bw, bh, u);
        text(svg, cx, uy + bh + 14, u.wiringPhase || 'L,N 0.5A 1ph', { fontSize: 8, fill: '#666', anchor: 'middle' });
        text(svg, cx, uy + bh + 28, u.remote || 'BRC1H62W', { fontSize: 8, fill: '#555', anchor: 'middle' });
    });

    return svg;
}


/* ======================== Shared unit box ======================== */
function drawUnitBox(svg, x, y, w, h, u) {
    rect(svg, x, y, w, h, { fill: '#e8eaf6', stroke: '#555', strokeWidth: 1.5 });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++)
        rect(svg, x + w - 18 + c * 8, y + 8 + r * 8, 4, 4, { fill: '#333', stroke: 'none' });
    text(svg, x + w / 2, y + 22, `A ${u.index}`, { fontSize: 11, fill: '#333', anchor: 'middle', fontWeight: '600' });
    text(svg, x + w / 2, y + 38, u.model, { fontSize: 8, fill: '#333', anchor: 'middle' });
    text(svg, x - 5, y + h + 12, u.connectors?.f || 'F1,F2', { fontSize: 9, fill: '#1565c0', anchor: 'end' });
    text(svg, x + w + 8, y + 18, u.connectors?.p || 'P1,P2', { fontSize: 9, fill: '#666' });
}
