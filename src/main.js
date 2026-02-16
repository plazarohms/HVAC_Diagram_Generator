/* -------------------------------------------------------
   main.js – Application entry point
   Features: presets, theme toggle, stats, color themes,
   fullscreen, generation counter, zoom/pan, export
------------------------------------------------------- */
import { generateSystem } from './generator.js';
import { renderRefrigerantDiagram } from './renderers/refrigerantDiagram.js';
import { renderElectricalDiagram } from './renderers/electricalDiagram.js';
import { renderWiringDiagram } from './renderers/wiringDiagram.js';

// ---- State ----
let currentConfig = null;
let currentDiagramType = 'refrigerant';
let currentLayout = 'horizontal-tree';
let currentColorTheme = 'classic';
let zoomScale = 1;
let generationCount = 0;
let diagramHistory = [];

// ---- Preset definitions ----
const PRESETS = {
    'small-office': { numUnits: 3, systemCapacity: 10, buildingType: 'office', numOutputs: 1, label: 'Small Office' },
    'large-commercial': { numUnits: 12, systemCapacity: 45, buildingType: 'commercial', numOutputs: 3, label: 'Large Commercial' },
    'residential': { numUnits: 4, systemCapacity: 12, buildingType: 'residential', numOutputs: 1, label: 'Residential' },
    'workshop': { numUnits: 6, systemCapacity: 20, buildingType: 'workshop', numOutputs: 2, label: 'Workshop' },
};

// ---- DOM refs ----
const container = document.getElementById('diagramContainer');
const placeholder = document.getElementById('placeholder');
const jsonEditor = document.getElementById('jsonEditor');
const numUnitsSlider = document.getElementById('numUnits');
const numUnitsVal = document.getElementById('numUnitsVal');
const capSlider = document.getElementById('systemCapacity');
const capVal = document.getElementById('systemCapacityVal');
const buildingSelect = document.getElementById('buildingType');
const layoutSelect = document.getElementById('layoutSelect');
const colorThemeSelect = document.getElementById('diagramColorTheme');
const numOutputsSlider = document.getElementById('numOutputs');
const numOutputsVal = document.getElementById('numOutputsVal');
const wiringRow = document.getElementById('wiringOutputsRow');
const zoomLevelEl = document.getElementById('zoomLevel');
const statsBar = document.getElementById('statsBar');
const genCounterEl = document.getElementById('genCounter');
const genBadge = document.getElementById('generationBadge');

const typeButtons = document.querySelectorAll('.type-btn');
const presetButtons = document.querySelectorAll('[data-preset]');
const btnGenerate = document.getElementById('btnGenerate');
const btnRenderJson = document.getElementById('btnRenderJson');
const btnExportSvg = document.getElementById('btnExportSvg');
const btnExportPng = document.getElementById('btnExportPng');
const btnCopyJson = document.getElementById('btnCopyJson');
const btnImportJson = document.getElementById('btnImportJson');
const jsonFileInput = document.getElementById('jsonFileInput');
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnZoomFit = document.getElementById('btnZoomFit');
const btnTheme = document.getElementById('btnThemeToggle');
const btnFullscreen = document.getElementById('btnFullscreen');


// ========== DARK/LIGHT THEME ==========
let isDark = true;
btnTheme.addEventListener('click', () => {
    isDark = !isDark;
    document.documentElement.classList.toggle('dark', isDark);
    btnTheme.textContent = isDark ? '🌙' : '☀️';
});


// ========== FULLSCREEN ==========
btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});


// ========== DIAGRAM TYPE SELECTION ==========
typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        typeButtons.forEach(b => {
            b.classList.remove('active');
            b.classList.remove('border-brand-500', 'dark:border-brand-500', 'dark:bg-brand-500/10', 'bg-brand-50', 'dark:text-brand-300', 'text-brand-600');
        });
        btn.classList.add('active', 'border-brand-500', 'dark:border-brand-500', 'dark:bg-brand-500/10', 'bg-brand-50', 'dark:text-brand-300', 'text-brand-600');
        currentDiagramType = btn.dataset.type;
        wiringRow.style.display = currentDiagramType === 'wiring' ? 'block' : 'none';
        if (currentConfig) renderDiagram();
    });
});
// Activate first button
const firstTypeBtn = document.querySelector('.type-btn[data-type="refrigerant"]');
if (firstTypeBtn) {
    firstTypeBtn.classList.add('border-brand-500', 'dark:border-brand-500', 'dark:bg-brand-500/10', 'bg-brand-50', 'dark:text-brand-300', 'text-brand-600');
}


// ========== LAYOUT & COLOR THEME ==========
layoutSelect.addEventListener('change', () => {
    currentLayout = layoutSelect.value;
    if (currentConfig) renderDiagram();
});

colorThemeSelect.addEventListener('change', () => {
    currentColorTheme = colorThemeSelect.value;
    if (currentConfig) renderDiagram();
});


// ========== SLIDERS ==========
numUnitsSlider.addEventListener('input', () => { numUnitsVal.textContent = numUnitsSlider.value; });
capSlider.addEventListener('input', () => { capVal.textContent = capSlider.value; });
numOutputsSlider.addEventListener('input', () => { numOutputsVal.textContent = numOutputsSlider.value; });


// ========== QUICK PRESETS ==========
presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const preset = PRESETS[btn.dataset.preset];
        if (!preset) return;
        numUnitsSlider.value = preset.numUnits;
        numUnitsVal.textContent = preset.numUnits;
        capSlider.value = preset.systemCapacity;
        capVal.textContent = preset.systemCapacity;
        buildingSelect.value = preset.buildingType;
        numOutputsSlider.value = preset.numOutputs;
        numOutputsVal.textContent = preset.numOutputs;
        // Auto-generate
        doGenerate();
        toast(`Preset: ${preset.label}`, 'info');
    });
});


// ========== GENERATE RANDOM ==========
btnGenerate.addEventListener('click', doGenerate);

function doGenerate() {
    const opts = {
        numUnits: parseInt(numUnitsSlider.value),
        systemCapacity: parseInt(capSlider.value),
        buildingType: buildingSelect.value,
        numOutputs: parseInt(numOutputsSlider.value),
    };
    currentConfig = generateSystem(opts);
    jsonEditor.value = JSON.stringify(currentConfig, null, 2);
    generationCount++;
    genCounterEl.textContent = generationCount;
    genBadge.style.opacity = '1';
    diagramHistory.push({ config: JSON.parse(JSON.stringify(currentConfig)), type: currentDiagramType, layout: currentLayout });
    renderDiagram();
    toast('Diagram generated!', 'success');
}


// ========== RENDER FROM JSON ==========
btnRenderJson.addEventListener('click', () => {
    try {
        currentConfig = JSON.parse(jsonEditor.value);
        renderDiagram();
        toast('Rendered from JSON!', 'success');
    } catch (e) {
        toast('Invalid JSON: ' + e.message, 'error');
    }
});


// ========== RENDER DIAGRAM ==========
function renderDiagram() {
    if (!currentConfig) return;

    const oldSvg = container.querySelector('svg');
    if (oldSvg) oldSvg.remove();
    if (placeholder) placeholder.style.display = 'none';

    let svg;
    try {
        switch (currentDiagramType) {
            case 'refrigerant':
                svg = renderRefrigerantDiagram(currentConfig, currentLayout);
                break;
            case 'electrical':
                svg = renderElectricalDiagram(currentConfig, currentLayout);
                break;
            case 'wiring':
                svg = renderWiringDiagram(currentConfig, currentLayout);
                break;
        }
    } catch (err) {
        console.error('Diagram render error:', err);
        toast('Render error: ' + err.message, 'error');
        return;
    }

    if (svg) {
        applyColorTheme(svg);
        svg.style.transition = 'transform .2s ease';
        zoomScale = 1;
        updateZoom();
        container.appendChild(svg);
        updateStats();
    }
}


// ========== COLOR THEMES ==========
function applyColorTheme(svg) {
    const bgRect = svg.querySelector('rect');
    switch (currentColorTheme) {
        case 'blueprint':
            if (bgRect) {
                bgRect.setAttribute('fill', '#1a237e');
            }
            // Change all text to lighter colors
            svg.querySelectorAll('text').forEach(t => {
                const fill = t.getAttribute('fill');
                if (fill === '#333' || fill === '#333333') t.setAttribute('fill', '#b0bec5');
                else if (fill === '#666' || fill === '#666666') t.setAttribute('fill', '#78909c');
                else if (fill === '#003399') t.setAttribute('fill', '#64b5f6');
                else if (fill === '#006600' || fill === '#009900') t.setAttribute('fill', '#81c784');
                else if (fill === '#0066cc') t.setAttribute('fill', '#90caf9');
            });
            // Change lines/strokes
            svg.querySelectorAll('line, polyline, path').forEach(el => {
                const stroke = el.getAttribute('stroke');
                if (stroke === '#333' || stroke === '#333333') el.setAttribute('stroke', '#546e7a');
                else if (stroke === '#999' || stroke === '#bbb' || stroke === '#ccc') el.setAttribute('stroke', '#37474f');
            });
            // Rects with light fills
            svg.querySelectorAll('rect').forEach(r => {
                const fill = r.getAttribute('fill');
                if (fill === '#f8f8f8' || fill === '#fafafa' || fill === '#f5f5f5') r.setAttribute('fill', '#283593');
                else if (fill === '#f0f4ff' || fill === '#f0fff0' || fill === '#fff5f0' || fill === '#fff8f0' || fill === '#f0f0ff') r.setAttribute('fill', '#1a237e');
                else if (fill === '#ddd' || fill === '#eee') r.setAttribute('fill', '#303f9f');
                else if (fill === '#e8eaf6') r.setAttribute('fill', '#283593');
                else if (fill === '#eceff1') r.setAttribute('fill', '#37474f');
            });
            break;

        case 'engineering':
            if (bgRect) {
                bgRect.setAttribute('fill', '#f5f5f0');
            }
            // Add a subtle grid pattern
            const defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS('http://www.w3.org/2000/svg', 'defs'), svg.firstChild);
            const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
            pattern.setAttribute('id', 'grid');
            pattern.setAttribute('width', '20');
            pattern.setAttribute('height', '20');
            pattern.setAttribute('patternUnits', 'userSpaceOnUse');
            const gridLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            gridLine1.setAttribute('d', 'M 20 0 L 0 0 0 20');
            gridLine1.setAttribute('fill', 'none');
            gridLine1.setAttribute('stroke', '#ddd');
            gridLine1.setAttribute('stroke-width', '0.5');
            pattern.appendChild(gridLine1);
            defs.appendChild(pattern);
            // Add grid background rect
            const gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            gridRect.setAttribute('width', '100%');
            gridRect.setAttribute('height', '100%');
            gridRect.setAttribute('fill', 'url(#grid)');
            svg.insertBefore(gridRect, svg.children[1] || null);
            break;
    }
}


// ========== STATS BAR ==========
function updateStats() {
    if (!currentConfig) return;
    const units = currentConfig.indoor || [];
    const project = currentConfig.project || {};

    document.getElementById('statUnits').textContent = units.length;
    document.getElementById('statCooling').textContent = (project.totalCooling || 0) + ' kW';
    document.getElementById('statHeating').textContent = (project.totalHeating || 0) + ' kW';
    document.getElementById('statOutdoor').textContent = currentConfig.outdoor?.model || '-';
    document.getElementById('statPipe').textContent = (project.totalPipeLength || 0) + ' m';
    document.getElementById('statLayout').textContent = currentLayout.replace(/-/g, ' ');
    document.getElementById('diagramTimestamp').textContent = new Date().toLocaleTimeString();

    // Show stats bar
    statsBar.style.opacity = '1';
    statsBar.style.transform = 'translateY(0)';
}


// ========== ZOOM ==========
function updateZoom() {
    const svg = container.querySelector('svg');
    if (svg) {
        svg.style.transform = `scale(${zoomScale})`;
        svg.style.transformOrigin = 'top left';
    }
    zoomLevelEl.textContent = Math.round(zoomScale * 100) + '%';
}

btnZoomIn.addEventListener('click', () => { zoomScale = Math.min(3, zoomScale + 0.1); updateZoom(); });
btnZoomOut.addEventListener('click', () => { zoomScale = Math.max(0.2, zoomScale - 0.1); updateZoom(); });
btnZoomFit.addEventListener('click', () => { zoomScale = 1; updateZoom(); });

container.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomScale = Math.max(0.2, Math.min(3, zoomScale + (e.deltaY > 0 ? -0.05 : 0.05)));
    updateZoom();
}, { passive: false });


// ========== PAN ==========
let isPanning = false, panStart = { x: 0, y: 0 }, scrollStart = { x: 0, y: 0 };
container.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    scrollStart = { x: container.scrollLeft, y: container.scrollTop };
});
window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    container.scrollLeft = scrollStart.x - (e.clientX - panStart.x);
    container.scrollTop = scrollStart.y - (e.clientY - panStart.y);
});
window.addEventListener('mouseup', () => { isPanning = false; });


// ========== EXPORT SVG ==========
btnExportSvg.addEventListener('click', () => {
    const svg = container.querySelector('svg');
    if (!svg) { toast('No diagram to export', 'error'); return; }
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    downloadBlob(blob, `hvac-diagram-${currentDiagramType}.svg`);
    toast('SVG exported!', 'success');
});


// ========== EXPORT PNG ==========
btnExportPng.addEventListener('click', () => {
    const svg = container.querySelector('svg');
    if (!svg) { toast('No diagram to export', 'error'); return; }
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    const w = parseInt(svg.getAttribute('width')) * 2;
    const h = parseInt(svg.getAttribute('height')) * 2;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
            downloadBlob(blob, `hvac-diagram-${currentDiagramType}.png`);
            toast('PNG exported!', 'success');
        }, 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
});


// ========== COPY JSON ==========
btnCopyJson.addEventListener('click', () => {
    navigator.clipboard.writeText(jsonEditor.value).then(() => {
        toast('JSON copied to clipboard!', 'info');
    });
});


// ========== IMPORT JSON ==========
btnImportJson.addEventListener('click', () => { jsonFileInput.click(); });
jsonFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        jsonEditor.value = reader.result;
        toast('JSON file loaded!', 'info');
    };
    reader.readAsText(file);
});


// ========== KEYBOARD SHORTCUTS ==========
document.addEventListener('keydown', (e) => {
    // Ctrl+G → Generate
    if (e.ctrlKey && e.key === 'g') { e.preventDefault(); doGenerate(); }
    // Ctrl+E → Export SVG
    if (e.ctrlKey && e.key === 'e') { e.preventDefault(); btnExportSvg.click(); }
    // Ctrl+D → Toggle dark mode
    if (e.ctrlKey && e.key === 'd') { e.preventDefault(); btnTheme.click(); }
    // +/- zoom
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomScale = Math.min(3, zoomScale + 0.1); updateZoom(); }
    if (e.key === '-') { e.preventDefault(); zoomScale = Math.max(0.2, zoomScale - 0.1); updateZoom(); }
    // 0 → reset zoom
    if (e.key === '0') { e.preventDefault(); zoomScale = 1; updateZoom(); }
    // 1/2/3 → switch diagram type
    if (e.key === '1' && !e.ctrlKey) { const btn = document.querySelector('[data-type="refrigerant"]'); if (btn && document.activeElement.tagName !== 'TEXTAREA') btn.click(); }
    if (e.key === '2' && !e.ctrlKey) { const btn = document.querySelector('[data-type="electrical"]'); if (btn && document.activeElement.tagName !== 'TEXTAREA') btn.click(); }
    if (e.key === '3' && !e.ctrlKey) { const btn = document.querySelector('[data-type="wiring"]'); if (btn && document.activeElement.tagName !== 'TEXTAREA') btn.click(); }
});


// ========== TOAST NOTIFICATIONS ==========
function toast(msg, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-gray-700' };
    const el = document.createElement('div');
    el.className = `pointer-events-auto px-3 py-2 rounded ${colors[type] || colors.info} text-white text-xs font-medium shadow toast-enter`;
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .2s'; }, 2500);
    setTimeout(() => el.remove(), 2700);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}


// ========== INIT ==========
wiringRow.style.display = 'none';
