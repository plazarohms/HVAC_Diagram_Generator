/* -------------------------------------------------------
   refrigerantDiagram.js – render refrigerant piping diagram
   Layout: outdoor unit left → joints → indoor units right
------------------------------------------------------- */
import { createSvg, g, rect, line, text, pipeLine, labelBox } from './svgUtils.js';
import { drawOutdoorUnit, drawIndoorUnit, drawJoint, drawRemote } from './icons.js';

const MARGIN = 60;
const UNIT_SPACING = 130;
const BRANCH_X_GAP = 180;

export function renderRefrigerantDiagram(config) {
    const units = config.indoor || [];
    const piping = config.piping || [];
    const project = config.project || {};
    const outdoor = config.outdoor || {};
    const n = units.length;

    // Compute canvas size
    const svgW = Math.max(1100, MARGIN * 2 + BRANCH_X_GAP * 4 + 200);
    const svgH = Math.max(600, MARGIN * 2 + n * UNIT_SPACING + 60);
    const svg = createSvg(svgW, svgH);

    // Background
    rect(svg, 0, 0, svgW, svgH, { fill: '#ffffff', stroke: 'none' });

    // --- Project info box (top-right) ---
    const infoX = svgW - 380;
    const infoY = 20;
    const infoG = g(svg, `translate(${infoX},${infoY})`);
    rect(infoG, 0, 0, 360, 180, { fill: '#fafafa', stroke: '#ccc', rx: 4 });
    const infoLines = [
        `Proyecto : ${project.name || 'HVAC PROJECT'}`,
        `Sistema : ${project.system || 'UE1'}`,
        `Condiciones de diseño: ${project.designConditions || ''}`,
        `Tramo total de tubería : ${project.totalPipeLength || 0} m  de  ${project.maxPipeLength || 0} m`,
        `Unidades interiores conectadas totales : ${n}`,
        `Capacidad en frío real total : ${project.totalCooling || 0} kW / ${project.totalHeating || 0} kW`,
        `Capacidad conectada : ${project.connectedCapacity || ''}`,
        `Factor diversidad : ${project.diversityFactor || '0%'}`,
        `Refrigerante adicional : ${project.additionalRefrigerant || 0} kg`,
        `Cantidad total de refrigerante : ${project.totalRefrigerant || 0} kg`,
    ];
    infoLines.forEach((txt, i) => {
        text(infoG, 12, 18 + i * 16, txt, { fontSize: 10, fill: i === 0 ? '#003399' : '#333', fontWeight: i === 0 ? '600' : '400' });
    });

    // --- Header ---
    text(svg, MARGIN, 30, 'Creado por HVAC Diagram Generator', { fontSize: 10, fill: '#666' });

    // --- Outdoor unit ---
    const ouX = MARGIN;
    const ouY = MARGIN + 100;
    drawOutdoorUnit(svg, ouX, ouY, outdoor.model || 'FDC140KXZEN1-W');

    // Build a tree of joints → units
    // Determine pipe segments structure
    const jointPositions = {};
    const unitPositions = {};

    // Place units vertically
    units.forEach((u, i) => {
        const ux = svgW - MARGIN - 200;
        const uy = MARGIN + 80 + i * UNIT_SPACING;
        unitPositions[`unit_${u.id}`] = { x: ux, y: uy, unit: u };
    });

    // Main joint position
    const mainJointX = ouX + 80 + BRANCH_X_GAP;
    const mainJointY = ouY + 35;
    jointPositions['joint_main'] = { x: mainJointX, y: mainJointY };

    // Sub-joints
    const subJoints = piping.filter(s => s.from === 'joint_main' && s.to.startsWith('joint_'));
    subJoints.forEach((s, i) => {
        const jx = mainJointX + BRANCH_X_GAP;
        // Spread sub-joints across vertical range
        const startY = MARGIN + 80;
        const endY = MARGIN + 80 + (n - 1) * UNIT_SPACING;
        const jy = n > 1
            ? startY + ((endY - startY) / Math.max(subJoints.length - 1, 1)) * i
            : (startY + endY) / 2;
        jointPositions[s.to] = { x: jx, y: jy };
    });

    // --- Draw piping ---
    piping.forEach(seg => {
        let fromPos, toPos;

        if (seg.from === 'outdoor') {
            fromPos = { x: ouX + 80, y: ouY + 35 };
        } else {
            fromPos = jointPositions[seg.from];
        }

        if (seg.to.startsWith('unit_')) {
            toPos = unitPositions[seg.to];
        } else {
            toPos = jointPositions[seg.to];
        }

        if (!fromPos || !toPos) return;

        const fx = fromPos.x;
        const fy = fromPos.y;
        const tx = toPos.x;
        const ty = toPos.y;

        // Draw pipe as L-shape or straight
        if (Math.abs(fy - ty) < 5) {
            // Horizontal
            pipeLine(svg, fx, fy, tx, ty, `${seg.gasSize}, ${seg.liquidSize}`, { stroke: '#333', labelColor: '#0066cc' });
        } else {
            // L-shape: horizontal then vertical then horizontal
            const midX = fx + (tx - fx) * 0.3;
            line(svg, fx, fy, midX, fy, { stroke: '#333', strokeWidth: 1.5 });
            line(svg, midX, fy, midX, ty, { stroke: '#333', strokeWidth: 1.5 });
            line(svg, midX, ty, tx, ty, { stroke: '#333', strokeWidth: 1.5 });

            // Pipe size label on horizontal segment
            text(svg, fx + 15, fy - 8, `${seg.gasSize}, ${seg.liquidSize}`, { fontSize: 9, fill: '#0066cc' });
            // Distance label
            text(svg, midX + 5, (fy + ty) / 2 + 4, `${seg.distance}m`, { fontSize: 9, fill: '#009900' });
        }

        // Draw joint node
        if (seg.joint) {
            const jPos = jointPositions[seg.to] || toPos;
            drawJoint(svg, jPos.x, jPos.y, seg.joint);
        }
    });

    // --- Draw main joint ---
    if (jointPositions['joint_main']) {
        drawJoint(svg, jointPositions['joint_main'].x, jointPositions['joint_main'].y, '');
    }

    // --- Draw indoor units ---
    units.forEach((u, i) => {
        const pos = unitPositions[`unit_${u.id}`];
        if (!pos) return;
        const ux = pos.x;
        const uy = pos.y;

        // Indoor unit icon
        drawIndoorUnit(svg, ux, uy, u.type);

        // Capacity labels (above unit)
        labelBox(svg, ux, uy - 28, [
            `${u.cooling_kw} kW/${u.heating_kw} kW`,
            `${u.index}. ${u.model}`,
        ], { fill: '#006600', fontSize: 9 });

        // Recovery capacity label
        text(svg, ux + 70, uy + 4, '0.00 kW/0.00 kW', { fontSize: 9, fill: '#666' });

        // Room label (below unit)
        text(svg, ux + 25, uy + 65, u.room || '', { fontSize: 10, fill: '#003399', anchor: 'middle', fontWeight: '600' });
        text(svg, ux + 25, uy + 78, u.location || '', { fontSize: 9, fill: '#333', anchor: 'middle' });

        // Remote controller (right side)
        drawRemote(svg, ux + 130, uy + 10, u.remote || 'RC-EX3A');
    });

    // --- Outdoor unit pipe stub + label ---
    const stubX = ouX + 80;
    const stubY = ouY + 35;
    line(svg, stubX, stubY, stubX + 30, stubY, { stroke: '#333', strokeWidth: 1.5 });
    const mainSeg = piping.find(s => s.from === 'outdoor');
    if (mainSeg) {
        text(svg, stubX + 5, stubY - 10, `${mainSeg.gasSize}`, { fontSize: 9, fill: '#333' });
        text(svg, stubX + 5, stubY + 14, `${mainSeg.distance}m`, { fontSize: 9, fill: '#009900' });
    }

    return svg;
}
