/* -------------------------------------------------------
   main.js – Application entry point
   Wires up UI controls, rendering, and export
------------------------------------------------------- */
import { generateSystem } from './generator.js';
import { renderRefrigerantDiagram } from './renderers/refrigerantDiagram.js';
import { renderElectricalDiagram } from './renderers/electricalDiagram.js';
import { renderWiringDiagram } from './renderers/wiringDiagram.js';

// ---- State ----
let currentConfig = null;
let currentDiagramType = 'refrigerant';
let zoomScale = 1;

// ---- DOM refs ----
const container = document.getElementById('diagramContainer');
const placeholder = document.getElementById('placeholder');
const jsonEditor = document.getElementById('jsonEditor');
const numUnitsSlider = document.getElementById('numUnits');
const numUnitsVal = document.getElementById('numUnitsVal');
const capSlider = document.getElementById('systemCapacity');
const capVal = document.getElementById('systemCapacityVal');
const buildingSelect = document.getElementById('buildingType');
const numOutputsSlider = document.getElementById('numOutputs');
const numOutputsVal = document.getElementById('numOutputsVal');
const wiringRow = document.getElementById('wiringOutputsRow');
const zoomLevelEl = document.getElementById('zoomLevel');

const typeButtons = document.querySelectorAll('.type-btn');
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

// ---- Diagram type selection ----
typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        typeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDiagramType = btn.dataset.type;
        // Show/hide wiring outputs param
        wiringRow.style.display = currentDiagramType === 'wiring' ? 'block' : 'none';
        // Re-render if we have a config
        if (currentConfig) renderDiagram();
    });
});

// ---- Slider updates ----
numUnitsSlider.addEventListener('input', () => { numUnitsVal.textContent = numUnitsSlider.value; });
capSlider.addEventListener('input', () => { capVal.textContent = capSlider.value; });
numOutputsSlider.addEventListener('input', () => { numOutputsVal.textContent = numOutputsSlider.value; });

// ---- Generate random ----
btnGenerate.addEventListener('click', () => {
    const opts = {
        numUnits: parseInt(numUnitsSlider.value),
        systemCapacity: parseInt(capSlider.value),
        buildingType: buildingSelect.value,
        numOutputs: parseInt(numOutputsSlider.value),
    };
    currentConfig = generateSystem(opts);
    jsonEditor.value = JSON.stringify(currentConfig, null, 2);
    renderDiagram();
    toast('Diagram generated!', 'success');
});

// ---- Render from JSON ----
btnRenderJson.addEventListener('click', () => {
    try {
        currentConfig = JSON.parse(jsonEditor.value);
        renderDiagram();
        toast('Rendered from JSON!', 'success');
    } catch (e) {
        toast('Invalid JSON: ' + e.message, 'error');
    }
});

// ---- Render diagram ----
function renderDiagram() {
    if (!currentConfig) return;

    // Remove old SVG
    const oldSvg = container.querySelector('svg');
    if (oldSvg) oldSvg.remove();
    if (placeholder) placeholder.style.display = 'none';

    let svg;
    switch (currentDiagramType) {
        case 'refrigerant':
            svg = renderRefrigerantDiagram(currentConfig);
            break;
        case 'electrical':
            svg = renderElectricalDiagram(currentConfig);
            break;
        case 'wiring':
            svg = renderWiringDiagram(currentConfig);
            break;
    }

    if (svg) {
        zoomScale = 1;
        updateZoom();
        container.appendChild(svg);
    }
}

// ---- Zoom ----
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

// ---- Pan ----
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

// ---- Export SVG ----
btnExportSvg.addEventListener('click', () => {
    const svg = container.querySelector('svg');
    if (!svg) { toast('No diagram to export', 'error'); return; }
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    downloadBlob(blob, 'hvac-diagram.svg');
    toast('SVG exported!', 'success');
});

// ---- Export PNG ----
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
            downloadBlob(blob, 'hvac-diagram.png');
            toast('PNG exported!', 'success');
        }, 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
});

// ---- Copy JSON ----
btnCopyJson.addEventListener('click', () => {
    navigator.clipboard.writeText(jsonEditor.value).then(() => {
        toast('JSON copied!', 'info');
    });
});

// ---- Import JSON ----
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

// ---- Toast notifications ----
function toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ---- Init ----
wiringRow.style.display = 'none';
