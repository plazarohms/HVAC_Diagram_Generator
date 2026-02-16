/* -------------------------------------------------------
   svgUtils.js – SVG element creation helpers
------------------------------------------------------- */

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createSvg(w, h) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('xmlns', SVG_NS);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.fontFamily = "'Inter', 'Segoe UI', sans-serif";

    // Defs for markers, patterns
    const defs = document.createElementNS(SVG_NS, 'defs');
    // Arrow marker
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', 'arrow');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '10');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    path.setAttribute('fill', '#333');
    marker.appendChild(path);
    defs.appendChild(marker);
    svg.appendChild(defs);

    return svg;
}

export function g(parent, transform) {
    const el = document.createElementNS(SVG_NS, 'g');
    if (transform) el.setAttribute('transform', transform);
    parent.appendChild(el);
    return el;
}

export function rect(parent, x, y, w, h, opts = {}) {
    const el = document.createElementNS(SVG_NS, 'rect');
    el.setAttribute('x', x);
    el.setAttribute('y', y);
    el.setAttribute('width', w);
    el.setAttribute('height', h);
    el.setAttribute('fill', opts.fill || 'none');
    el.setAttribute('stroke', opts.stroke || '#333');
    el.setAttribute('stroke-width', opts.strokeWidth || 1);
    if (opts.rx) el.setAttribute('rx', opts.rx);
    if (opts.strokeDash) el.setAttribute('stroke-dasharray', opts.strokeDash);
    if (opts.opacity !== undefined) el.setAttribute('opacity', opts.opacity);
    parent.appendChild(el);
    return el;
}

export function line(parent, x1, y1, x2, y2, opts = {}) {
    const el = document.createElementNS(SVG_NS, 'line');
    el.setAttribute('x1', x1);
    el.setAttribute('y1', y1);
    el.setAttribute('x2', x2);
    el.setAttribute('y2', y2);
    el.setAttribute('stroke', opts.stroke || '#333');
    el.setAttribute('stroke-width', opts.strokeWidth || 1);
    if (opts.strokeDash) el.setAttribute('stroke-dasharray', opts.strokeDash);
    parent.appendChild(el);
    return el;
}

export function polyline(parent, points, opts = {}) {
    const el = document.createElementNS(SVG_NS, 'polyline');
    el.setAttribute('points', points.map(p => p.join(',')).join(' '));
    el.setAttribute('fill', opts.fill || 'none');
    el.setAttribute('stroke', opts.stroke || '#333');
    el.setAttribute('stroke-width', opts.strokeWidth || 1);
    if (opts.strokeDash) el.setAttribute('stroke-dasharray', opts.strokeDash);
    parent.appendChild(el);
    return el;
}

export function text(parent, x, y, content, opts = {}) {
    const el = document.createElementNS(SVG_NS, 'text');
    el.setAttribute('x', x);
    el.setAttribute('y', y);
    el.setAttribute('fill', opts.fill || '#333');
    el.setAttribute('font-size', opts.fontSize || 11);
    el.setAttribute('font-family', opts.fontFamily || "'Inter', sans-serif");
    if (opts.fontWeight) el.setAttribute('font-weight', opts.fontWeight);
    if (opts.anchor) el.setAttribute('text-anchor', opts.anchor);
    if (opts.dominantBaseline) el.setAttribute('dominant-baseline', opts.dominantBaseline);
    el.textContent = content;
    parent.appendChild(el);
    return el;
}

export function path(parent, d, opts = {}) {
    const el = document.createElementNS(SVG_NS, 'path');
    el.setAttribute('d', d);
    el.setAttribute('fill', opts.fill || 'none');
    el.setAttribute('stroke', opts.stroke || '#333');
    el.setAttribute('stroke-width', opts.strokeWidth || 1);
    if (opts.strokeDash) el.setAttribute('stroke-dasharray', opts.strokeDash);
    parent.appendChild(el);
    return el;
}

export function circle(parent, cx, cy, r, opts = {}) {
    const el = document.createElementNS(SVG_NS, 'circle');
    el.setAttribute('cx', cx);
    el.setAttribute('cy', cy);
    el.setAttribute('r', r);
    el.setAttribute('fill', opts.fill || 'none');
    el.setAttribute('stroke', opts.stroke || '#333');
    el.setAttribute('stroke-width', opts.strokeWidth || 1);
    parent.appendChild(el);
    return el;
}

/** Draw a horizontal pipe with label */
export function pipeLine(parent, x1, y1, x2, y2, label, opts = {}) {
    line(parent, x1, y1, x2, y2, { stroke: opts.stroke || '#333', strokeWidth: opts.strokeWidth || 1.5 });
    if (label) {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2 - 6;
        text(parent, mx, my, label, { fontSize: 9, fill: opts.labelColor || '#0066cc', anchor: 'middle' });
    }
}

/** Draw a label box (like capacity info) */
export function labelBox(parent, x, y, lines, opts = {}) {
    const lineHeight = 14;
    const grp = g(parent, `translate(${x},${y})`);
    lines.forEach((txt, i) => {
        text(grp, 0, i * lineHeight, txt, {
            fontSize: opts.fontSize || 10,
            fill: opts.fill || (i === 0 ? '#006600' : '#333'),
            fontWeight: i === 0 ? '600' : '400',
        });
    });
    return grp;
}
