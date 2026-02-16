/* -------------------------------------------------------
   icons.js – SVG icon drawings for HVAC components
------------------------------------------------------- */
import { g, rect, line, text, path, circle } from './svgUtils.js';

/**
 * Draw outdoor unit icon (compressor box with fan symbol)
 * Returns group element; anchor is top-left.
 */
export function drawOutdoorUnit(parent, x, y, model) {
    const grp = g(parent, `translate(${x},${y})`);
    // Main box
    rect(grp, 0, 0, 80, 70, { fill: '#f8f8f8', stroke: '#333', strokeWidth: 1.5 });
    // Fan circle
    circle(grp, 40, 28, 18, { stroke: '#666', strokeWidth: 1 });
    // Fan blades
    path(grp, 'M40,10 Q50,28 40,28', { stroke: '#666' });
    path(grp, 'M40,28 Q30,28 40,46', { stroke: '#666' });
    path(grp, 'M40,28 Q50,28 40,46', { stroke: '#666' });
    path(grp, 'M40,28 Q30,28 40,10', { stroke: '#666' });
    // Base
    rect(grp, 5, 56, 70, 10, { fill: '#ddd', stroke: '#999' });
    // Model label
    text(grp, 40, 82, model || '', { fontSize: 8, fill: '#0066cc', anchor: 'middle', fontWeight: '600' });
    return grp;
}

/**
 * Draw indoor unit icon by type
 */
export function drawIndoorUnit(parent, x, y, type) {
    const grp = g(parent, `translate(${x},${y})`);

    switch (type) {
        case 'cassette':
            // 4-way cassette — square with vanes
            rect(grp, 0, 0, 50, 50, { fill: '#f0f4ff', stroke: '#333' });
            line(grp, 10, 25, 40, 25, { stroke: '#999' });
            line(grp, 25, 10, 25, 40, { stroke: '#999' });
            // Grille marks
            for (let i = 15; i <= 35; i += 5) {
                line(grp, i, 5, i, 10, { stroke: '#bbb' });
                line(grp, i, 40, i, 45, { stroke: '#bbb' });
            }
            break;

        case 'ducted':
            // Ducted unit — rectangle with arrows
            rect(grp, 0, 5, 60, 35, { fill: '#f0fff0', stroke: '#333' });
            path(grp, 'M10,22 L25,15 L25,30 Z', { fill: '#999', stroke: 'none' });
            path(grp, 'M35,22 L50,15 L50,30 Z', { fill: '#999', stroke: 'none' });
            break;

        case 'wall':
            // Wall mount — curved top
            path(grp, 'M0,15 Q25,-5 50,15 L50,40 L0,40 Z', { fill: '#fff5f0', stroke: '#333' });
            // Louver lines
            for (let i = 20; i <= 35; i += 5) {
                line(grp, 8, i, 42, i, { stroke: '#ccc' });
            }
            break;

        case 'floor':
            // Floor standing
            rect(grp, 5, 0, 40, 55, { fill: '#fff8f0', stroke: '#333' });
            // Vent grille
            for (let i = 5; i <= 20; i += 4) {
                line(grp, 12, i, 38, i, { stroke: '#ccc' });
            }
            rect(grp, 12, 30, 26, 18, { fill: '#eee', stroke: '#bbb' });
            break;

        case 'slim-ducted':
            // Slim ducted
            rect(grp, 0, 10, 55, 25, { fill: '#f0f0ff', stroke: '#333' });
            path(grp, 'M8,22 L18,17 L18,27 Z', { fill: '#aaa', stroke: 'none' });
            break;

        default:
            rect(grp, 0, 0, 50, 40, { fill: '#f5f5f5', stroke: '#333' });
    }
    return grp;
}

/**
 * Draw a distribution joint node
 */
export function drawJoint(parent, x, y, model) {
    const grp = g(parent, `translate(${x},${y})`);
    circle(grp, 0, 0, 6, { fill: '#fff', stroke: '#333', strokeWidth: 1.5 });
    circle(grp, 0, 0, 2, { fill: '#333' });
    if (model) {
        text(grp, 0, -12, model, { fontSize: 8, fill: '#333', anchor: 'middle' });
    }
    return grp;
}

/**
 * Draw remote controller label
 */
export function drawRemote(parent, x, y, model) {
    const grp = g(parent, `translate(${x},${y})`);
    rect(grp, 0, 0, 60, 20, { fill: '#f5f5f5', stroke: '#999', rx: 3 });
    text(grp, 30, 14, model, { fontSize: 9, fill: '#333', anchor: 'middle' });
    return grp;
}

/**
 * Draw power supply triangle symbol
 */
export function drawPowerSupply(parent, x, y, label) {
    const grp = g(parent, `translate(${x},${y})`);
    path(grp, 'M0,-15 L12,10 L-12,10 Z', { fill: '#1a237e', stroke: '#1a237e' });
    if (label) {
        text(grp, 20, -5, label, { fontSize: 10, fill: '#333' });
    }
    return grp;
}

/**
 * Draw breaker symbol (magnetothermic / differential)
 */
export function drawBreaker(parent, x, y, label) {
    const grp = g(parent, `translate(${x},${y})`);
    rect(grp, -8, -8, 16, 16, { fill: '#fff', stroke: '#333' });
    // Diagonal symbol
    line(grp, -5, 5, 5, -5, { stroke: '#333', strokeWidth: 1.5 });
    if (label) {
        text(grp, 20, 4, label, { fontSize: 10, fill: '#333' });
    }
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
 * Draw an electrical connection box (indoor unit in electrical diagram)
 */
export function drawElectricalBox(parent, x, y, addressInfo) {
    const grp = g(parent, `translate(${x},${y})`);
    const w = 65, h = 60;
    rect(grp, 0, 0, w, h, { fill: '#f8f8ff', stroke: '#333', strokeWidth: 1.5 });
    // Phase & code
    text(grp, w / 2, 16, addressInfo.phase || '12', { fontSize: 11, fill: '#333', anchor: 'middle', fontWeight: '600' });
    text(grp, w - 5, 16, addressInfo.code || 'AB', { fontSize: 9, fill: '#666', anchor: 'end' });
    // Out address
    text(grp, w / 2, 32, addressInfo.outAddr || 'Out00', { fontSize: 10, fill: '#333', anchor: 'middle' });
    // In address
    text(grp, w / 2, 48, addressInfo.inAddr || 'In 00', { fontSize: 10, fill: '#333', anchor: 'middle' });
    return grp;
}

/**
 * Draw connector block (for wiring diagrams)
 */
export function drawConnectorBlock(parent, x, y, label, w, h) {
    w = w || 90; h = h || 50;
    const grp = g(parent, `translate(${x},${y})`);
    rect(grp, 0, 0, w, h, { fill: '#e8eaf6', stroke: '#555', strokeWidth: 1.5 });
    // Connector dots
    const dotSize = 3;
    for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
            rect(grp, 8 + c * 10, 8 + r * 10, dotSize, dotSize, { fill: '#333', stroke: 'none' });
        }
    }
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
