/* -------------------------------------------------------
   icons.js – SVG icon drawings for HVAC components
   Detailed Mitsubishi e-Solution style icons
------------------------------------------------------- */
import { g, rect, line, text, path, circle } from './svgUtils.js';

/**
 * Draw outdoor unit – detailed 3D box with fan grille (like reference)
 * Size: ~100×90, anchor top-left
 */
export function drawOutdoorUnit(parent, x, y, model) {
    const grp = g(parent, `translate(${x},${y})`);
    const w = 100, h = 80;
    // Shadow / 3D effect
    rect(grp, 4, 4, w, h, { fill: '#ddd', stroke: 'none' });
    // Main body
    rect(grp, 0, 0, w, h, { fill: '#f0f0f0', stroke: '#333', strokeWidth: 1.5 });
    // Top section line
    line(grp, 0, 15, w, 15, { stroke: '#999' });
    // Fan grille area (left side)
    rect(grp, 6, 20, 44, 50, { fill: '#e8e8e8', stroke: '#999' });
    // Fan circle
    circle(grp, 28, 45, 18, { stroke: '#888', strokeWidth: 1.5 });
    // Fan blades (6 spokes)
    for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * Math.PI / 180;
        const ex = 28 + Math.cos(angle) * 16;
        const ey = 45 + Math.sin(angle) * 16;
        line(grp, 28, 45, ex, ey, { stroke: '#999', strokeWidth: 0.8 });
    }
    circle(grp, 28, 45, 3, { fill: '#888', stroke: 'none' });
    // Compressor section (right side) - grille lines
    for (let i = 22; i < 68; i += 4) {
        line(grp, 56, i, 94, i, { stroke: '#ccc', strokeWidth: 0.6 });
    }
    // Base feet
    rect(grp, 8, h, 12, 6, { fill: '#999', stroke: '#666' });
    rect(grp, w - 20, h, 12, 6, { fill: '#999', stroke: '#666' });
    // Pipe connections (right side)
    circle(grp, w, 35, 3, { fill: '#fff', stroke: '#666', strokeWidth: 1.5 });
    circle(grp, w, 55, 3, { fill: '#fff', stroke: '#666', strokeWidth: 1.5 });
    return grp;
}

/**
 * Draw indoor unit icon by type – more detailed, with dashed border frame
 * Each type has distinctive shape matching the reference
 */
export function drawIndoorUnit(parent, x, y, type) {
    const grp = g(parent, `translate(${x},${y})`);

    switch (type) {
        case 'cassette': {
            // 4-way cassette – square panel view
            rect(grp, 0, 0, 56, 50, { fill: '#f5f5f5', stroke: '#333', strokeWidth: 1.2 });
            //  4 directional vents
            line(grp, 5, 25, 51, 25, { stroke: '#bbb' });
            line(grp, 28, 5, 28, 45, { stroke: '#bbb' });
            // Grille marks on all 4 sides
            for (let i = 10; i <= 46; i += 6) {
                line(grp, i, 3, i, 8, { stroke: '#ccc', strokeWidth: 0.6 });
                line(grp, i, 42, i, 47, { stroke: '#ccc', strokeWidth: 0.6 });
            }
            for (let i = 10; i <= 40; i += 6) {
                line(grp, 3, i, 8, i, { stroke: '#ccc', strokeWidth: 0.6 });
                line(grp, 48, i, 53, i, { stroke: '#ccc', strokeWidth: 0.6 });
            }
            break;
        }
        case 'ducted': {
            // Ducted unit – wide rectangle with airflow arrows
            rect(grp, 0, 5, 65, 40, { fill: '#f0f4ff', stroke: '#333', strokeWidth: 1.2 });
            // Duct connections left/right
            rect(grp, -5, 12, 5, 26, { fill: '#e0e0e0', stroke: '#999' });
            rect(grp, 65, 12, 5, 26, { fill: '#e0e0e0', stroke: '#999' });
            // Airflow arrows
            path(grp, 'M15,25 L25,20 L25,30 Z', { fill: '#aaa', stroke: 'none' });
            path(grp, 'M40,25 L50,20 L50,30 Z', { fill: '#aaa', stroke: 'none' });
            // Internal lines
            line(grp, 30, 10, 30, 40, { stroke: '#ddd' });
            break;
        }
        case 'wall': {
            // Wall mount – curved body like real unit
            path(grp, 'M0,18 Q28,-4 56,18 L56,42 Q28,38 0,42 Z', { fill: '#fafafa', stroke: '#333', strokeWidth: 1.2 });
            // Air outlet louver lines
            for (let i = 28; i <= 38; i += 3) {
                line(grp, 6, i, 50, i, { stroke: '#ddd', strokeWidth: 0.8 });
            }
            // LED indicator
            rect(grp, 24, 22, 8, 2, { fill: '#4caf50', stroke: 'none' });
            break;
        }
        case 'floor': {
            // Floor standing – tall narrow unit
            rect(grp, 8, 0, 40, 55, { fill: '#fafafa', stroke: '#333', strokeWidth: 1.2 });
            // Top vent grille
            for (let i = 4; i <= 18; i += 3) {
                line(grp, 14, i, 42, i, { stroke: '#ddd', strokeWidth: 0.6 });
            }
            // Control panel area
            rect(grp, 14, 25, 28, 8, { fill: '#e8e8e8', stroke: '#ccc' });
            // Bottom intake grille
            for (let i = 38; i <= 50; i += 3) {
                line(grp, 14, i, 42, i, { stroke: '#ddd', strokeWidth: 0.6 });
            }
            break;
        }
        case 'slim-ducted': {
            // Slim ducted – low profile
            rect(grp, 0, 12, 60, 26, { fill: '#f0f0ff', stroke: '#333', strokeWidth: 1.2 });
            rect(grp, -4, 18, 4, 14, { fill: '#e0e0e0', stroke: '#999' });
            rect(grp, 60, 18, 4, 14, { fill: '#e0e0e0', stroke: '#999' });
            path(grp, 'M12,25 L20,21 L20,29 Z', { fill: '#bbb', stroke: 'none' });
            break;
        }
        default:
            rect(grp, 0, 0, 56, 45, { fill: '#f5f5f5', stroke: '#333', strokeWidth: 1.2 });
    }
    return grp;
}

/**
 * Draw distribution joint – small symbol labeled with model
 * Drawn at center (cx, cy)
 */
export function drawJoint(parent, x, y, model) {
    const grp = g(parent, `translate(${x},${y})`);
    // T-junction symbol
    line(grp, -8, 0, 8, 0, { stroke: '#333', strokeWidth: 1.5 });
    line(grp, 0, 0, 0, 8, { stroke: '#333', strokeWidth: 1.5 });
    circle(grp, 0, 0, 3, { fill: '#333', stroke: '#333' });
    if (model) {
        text(grp, 5, -6, model, { fontSize: 8, fill: '#333', fontWeight: '500' });
    }
    return grp;
}

/**
 * Draw remote controller icon – small laptop/tablet shape
 */
export function drawRemote(parent, x, y, model) {
    const grp = g(parent, `translate(${x},${y})`);
    // Screen
    rect(grp, 0, 0, 30, 20, { fill: '#f5f5f5', stroke: '#666', strokeWidth: 1 });
    // Keyboard/base
    path(grp, 'M-3,20 L33,20 L30,26 L0,26 Z', { fill: '#e0e0e0', stroke: '#666', strokeWidth: 0.8 });
    // Screen lines
    line(grp, 4, 6, 26, 6, { stroke: '#ccc', strokeWidth: 0.5 });
    line(grp, 4, 10, 20, 10, { stroke: '#ccc', strokeWidth: 0.5 });
    line(grp, 4, 14, 22, 14, { stroke: '#ccc', strokeWidth: 0.5 });
    // Label
    text(grp, 15, 40, model, { fontSize: 8, fill: '#333', anchor: 'middle' });
    return grp;
}

/**
 * Draw power supply triangle symbol
 */
export function drawPowerSupply(parent, x, y, label) {
    const grp = g(parent, `translate(${x},${y})`);
    path(grp, 'M0,-15 L12,10 L-12,10 Z', { fill: '#1a237e', stroke: '#1a237e' });
    if (label) text(grp, 20, -5, label, { fontSize: 10, fill: '#333' });
    return grp;
}

/**
 * Draw breaker symbol
 */
export function drawBreaker(parent, x, y, label) {
    const grp = g(parent, `translate(${x},${y})`);
    rect(grp, -8, -8, 16, 16, { fill: '#fff', stroke: '#333' });
    line(grp, -5, 5, 5, -5, { stroke: '#333', strokeWidth: 1.5 });
    if (label) text(grp, 20, 4, label, { fontSize: 10, fill: '#333' });
    return grp;
}

/**
 * Draw ground symbol
 */
export function drawGround(parent, x, y) {
    const grp = g(parent, `translate(${x},${y})`);
    line(grp, 0, 0, 0, 8, { stroke: '#333' });
    line(grp, -8, 8, 8, 8, { stroke: '#333', strokeWidth: 1.5 });
    line(grp, -5, 12, 5, 12, { stroke: '#333', strokeWidth: 1.2 });
    line(grp, -2, 16, 2, 16, { stroke: '#333' });
    return grp;
}

/**
 * Draw electrical connection box
 */
export function drawElectricalBox(parent, x, y, addressInfo) {
    const grp = g(parent, `translate(${x},${y})`);
    const w = 65, h = 60;
    rect(grp, 0, 0, w, h, { fill: '#f8f8ff', stroke: '#333', strokeWidth: 1.5 });
    text(grp, w / 2, 16, addressInfo.phase || '12', { fontSize: 11, fill: '#333', anchor: 'middle', fontWeight: '600' });
    text(grp, w - 5, 16, addressInfo.code || 'AB', { fontSize: 9, fill: '#666', anchor: 'end' });
    text(grp, w / 2, 32, addressInfo.outAddr || 'Out00', { fontSize: 10, fill: '#333', anchor: 'middle' });
    text(grp, w / 2, 48, addressInfo.inAddr || 'In 00', { fontSize: 10, fill: '#333', anchor: 'middle' });
    return grp;
}

/**
 * Draw connector block (wiring diagrams)
 */
export function drawConnectorBlock(parent, x, y, label, w, h) {
    w = w || 90; h = h || 50;
    const grp = g(parent, `translate(${x},${y})`);
    rect(grp, 0, 0, w, h, { fill: '#e8eaf6', stroke: '#555', strokeWidth: 1.5 });
    for (let r = 0; r < 2; r++)
        for (let c = 0; c < 2; c++)
            rect(grp, 8 + c * 10, 8 + r * 10, 3, 3, { fill: '#333', stroke: 'none' });
    if (label) {
        const lines = label.split('\n');
        lines.forEach((l, i) => {
            text(grp, w / 2, 20 + i * 14, l, { fontSize: 10, fill: '#333', anchor: 'middle', fontWeight: i === 0 ? '600' : '400' });
        });
    }
    return grp;
}

/**
 * Draw wiring remote controller block
 */
export function drawWiringRemote(parent, x, y, model) {
    const grp = g(parent, `translate(${x},${y})`);
    const w = 80, h = 30;
    rect(grp, 0, 0, w, h, { fill: '#eceff1', stroke: '#78909c', strokeWidth: 1.5 });
    text(grp, w / 2, h / 2 + 4, model, { fontSize: 10, fill: '#333', anchor: 'middle', fontWeight: '500' });
    return grp;
}
