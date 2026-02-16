/* -------------------------------------------------------
   wiringDiagram.js – render wiring output diagram
   Layout: outdoor unit top-left → vertical cascade of indoor units
------------------------------------------------------- */
import { createSvg, g, rect, line, text, polyline } from './svgUtils.js';
import { drawConnectorBlock, drawWiringRemote } from './icons.js';

const UNIT_VGAP = 140;
const LEFT_MARGIN = 60;

export function renderWiringDiagram(config) {
    const outputs = config.wiringOutputs || [];
    if (outputs.length === 0) return createSvg(400, 200);

    // Total units across all outputs
    const totalUnits = outputs.reduce((s, o) => s + o.units.length, 0);
    const svgW = 750;
    const svgH = Math.max(500, 120 + totalUnits * UNIT_VGAP + 60);
    const svg = createSvg(svgW, svgH);

    rect(svg, 0, 0, svgW, svgH, { fill: '#ffffff', stroke: 'none' });

    let globalY = 0;

    outputs.forEach((output, oi) => {
        const startY = globalY + 30;
        const n = output.units.length;

        // --- Title ---
        text(svg, LEFT_MARGIN, startY, `Wiring Out ${output.outputIndex}`, {
            fontSize: 16, fill: '#003399', fontWeight: '600',
        });

        // --- Outdoor unit block ---
        const ouX = LEFT_MARGIN;
        const ouY = startY + 30;
        const ouW = 110;
        const ouH = 45;
        rect(svg, ouX, ouY, ouW, ouH, { fill: '#e8eaf6', stroke: '#555', strokeWidth: 1.5 });
        // Connector dots (2x2 grid)
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
                rect(svg, ouX + ouW - 20 + c * 8, ouY + 8 + r * 8, 4, 4, { fill: '#333', stroke: 'none' });
            }
        }
        text(svg, ouX + 10, ouY + 20, `Out ${output.outputIndex}`, { fontSize: 9, fill: '#666' });
        text(svg, ouX + 10, ouY + 34, output.outdoorLabel || output.outdoorModel, { fontSize: 9, fill: '#333', fontWeight: '500' });
        // Model below
        text(svg, ouX + ouW / 2, ouY + ouH + 14, output.outdoorModel, { fontSize: 9, fill: '#333', anchor: 'middle' });
        // Phase label above
        text(svg, ouX + ouW + 15, ouY + 14, output.phase || '', { fontSize: 9, fill: '#666' });
        // Connector label
        text(svg, ouX + 10, ouY + ouH + 28, output.connectorLabel || 'N,F1,F2', { fontSize: 9, fill: '#1565c0', fontWeight: '500' });

        // --- Indoor units cascade ---
        const iuStartX = ouX + 200;
        const iuStartY = ouY;

        output.units.forEach((u, ui) => {
            const ux = iuStartX + 40;
            const uy = iuStartY + ui * UNIT_VGAP;
            const bw = 90;
            const bh = 50;

            // --- Wiring from outdoor/previous unit ---
            if (ui === 0) {
                // First unit: connect from outdoor
                const fromX = ouX + ouW;
                const fromY = ouY + ouH / 2;
                // Horizontal to unit column
                line(svg, fromX, fromY, ux - 10, fromY, { stroke: '#1565c0', strokeWidth: 2 });
                // Vertical down if needed
                if (uy + bh / 2 > fromY) {
                    line(svg, ux - 10, fromY, ux - 10, uy + bh / 2, { stroke: '#1565c0', strokeWidth: 2 });
                }
                line(svg, ux - 10, uy + bh / 2, ux, uy + bh / 2, { stroke: '#1565c0', strokeWidth: 2 });
            } else {
                // Subsequent units: connect from above
                const prevY = iuStartY + (ui - 1) * UNIT_VGAP + bh;
                // Diagonal/L-shape blue wire from previous unit's connector
                const wireX = ux - 25;
                line(svg, wireX, prevY + 5, wireX, uy + bh / 2, { stroke: '#1565c0', strokeWidth: 2 });
                line(svg, wireX, uy + bh / 2, ux, uy + bh / 2, { stroke: '#1565c0', strokeWidth: 2 });

                // Small connector dots at junction
                rect(svg, wireX - 3, prevY + 2, 6, 6, { fill: '#1565c0', stroke: 'none' });
            }

            // --- Indoor unit box ---
            rect(svg, ux, uy, bw, bh, { fill: '#e8eaf6', stroke: '#555', strokeWidth: 1.5 });
            // Connector dots
            for (let r = 0; r < 2; r++) {
                for (let c = 0; c < 2; c++) {
                    rect(svg, ux + bw - 18 + c * 8, uy + 8 + r * 8, 4, 4, { fill: '#333', stroke: 'none' });
                }
            }
            // Unit label
            text(svg, ux + bw / 2, uy + 22, `A ${u.index}`, { fontSize: 11, fill: '#333', anchor: 'middle', fontWeight: '600' });
            text(svg, ux + bw / 2, uy + 38, u.model, { fontSize: 8, fill: '#333', anchor: 'middle' });

            // Left connector labels (F1,F2)
            text(svg, ux - 5, uy + bh + 12, u.connectors?.f || 'F1,F2', { fontSize: 9, fill: '#1565c0', anchor: 'end' });

            // Right connector labels (P1,P2)
            const pLabelX = ux + bw + 8;
            text(svg, pLabelX, uy + 18, u.connectors?.p || 'P1,P2', { fontSize: 9, fill: '#666' });

            // --- Phase/current label line to remote ---
            const remX = ux + bw + 120;
            const remY = uy + 10;
            // Wiring phase label
            text(svg, ux + bw + 50, uy + 5, u.wiringPhase || 'L,N 0.5A 1ph', { fontSize: 9, fill: '#666' });
            // Horizontal line to remote
            line(svg, ux + bw + 8, uy + bh / 2, remX, uy + bh / 2, { stroke: '#1565c0', strokeWidth: 1.5 });

            // --- Remote controller ---
            drawWiringRemote(svg, remX, remY, u.remote || 'BRC1H62W');
        });

        globalY += 30 + n * UNIT_VGAP + 40;
    });

    return svg;
}
