/* -------------------------------------------------------
   generator.js – random HVAC configuration generator
   Produces deep hierarchical piping trees matching
   Mitsubishi e-Solution style diagrams
------------------------------------------------------- */
import {
    UNIT_TYPES, INDOOR_MODELS, OUTDOOR_MODELS, REMOTE_CONTROLLERS,
    PIPE_SIZES, JOINT_MODELS, BUILDING_PREFIXES, PHASES, modelCapacity,
} from './schema.js';

const pick = a => a[Math.floor(Math.random() * a.length)];
const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const randInt = (lo, hi) => Math.floor(rand(lo, hi + 1));
const round1 = v => Math.round(v * 10) / 10;

let _id = 0;
function nextId() { return ++_id; }

/**
 * Generate a full HVAC system configuration.
 */
export function generateSystem(opts = {}) {
    _id = 0;
    const numUnits = opts.numUnits ?? 6;
    const systemCapacity = opts.systemCapacity ?? 14;
    const buildingType = opts.buildingType ?? 'office';
    const numOutputs = opts.numOutputs ?? 1;

    // Outdoor unit
    const outdoorModel = pick(OUTDOOR_MODELS);
    const outdoorCap = modelCapacity(outdoorModel);

    // Indoor units
    const units = [];
    const rooms = BUILDING_PREFIXES[buildingType] || BUILDING_PREFIXES.office;

    for (let i = 0; i < numUnits; i++) {
        const unitType = pick(UNIT_TYPES);
        const models = INDOOR_MODELS[unitType];
        const model = pick(models);
        const cap = modelCapacity(model);
        const scaleFactor = systemCapacity / (numUnits * 2.5);
        const cool = round1(cap.cool * Math.max(0.8, Math.min(1.5, scaleFactor)));
        const heat = round1(cap.heat * Math.max(0.8, Math.min(1.5, scaleFactor)));

        const roomName = buildingType === 'workshop'
            ? rooms[i % rooms.length]
            : `${pick(rooms)} ${i + 1}`;
        const locationCode = `S/L${String(i).padStart(2, '0')}`;
        const typePrefix = model.substring(0, 3).toUpperCase();

        units.push({
            id: nextId(),
            index: i + 1,
            type: unitType,
            model,
            cooling_kw: cool,
            heating_kw: heat,
            room: `${roomName} ${typePrefix}`,
            location: locationCode,
            remote: pick(REMOTE_CONTROLLERS),
        });
    }

    // Build deep piping tree
    const pipingTree = buildDeepPipingTree(units);

    // Electrical info
    const phase = numUnits > 6 ? PHASES[1] : pick(PHASES);
    const electrical = {
        power_supply: phase,
        breakers: [
            { type: 'Diferencial Interruptor', label: 'Diferencial Interruptor' },
            { type: 'Magnetotermico', label: 'Magnetotermico' },
        ],
        outdoor_address: { phase: phase.includes('3') ? '123N' : '12', code: 'AB', out: 'Out00' },
        indoor_addresses: units.map((u, i) => ({
            unitId: u.id,
            phase: '12',
            code: 'AB',
            inAddr: `In ${String(i).padStart(2, '0')}`,
            outAddr: 'Out00',
        })),
    };

    // Wiring outputs
    const wiringOutputs = [];
    const unitsPerOutput = Math.ceil(numUnits / numOutputs);
    for (let o = 0; o < numOutputs; o++) {
        const start = o * unitsPerOutput;
        const end = Math.min(start + unitsPerOutput, numUnits);
        const subset = units.slice(start, end);
        wiringOutputs.push({
            outputIndex: o + 1,
            outdoorModel,
            outdoorLabel: outdoorModel,
            phase: phase.includes('3') ? `L1,L2,L3,N ${randInt(15, 25)}A 3Nph` : `L,N ${round1(rand(0.4, 1.2))}A 1ph`,
            connectorLabel: 'N,F1,F2',
            units: subset.map(u => ({
                ...u,
                connectors: { f: 'F1,F2', p: 'P1,P2' },
                wiringPhase: `L,N ${round1(rand(0.4, 0.8))}A 1ph`,
            })),
        });
    }

    // Project metadata
    const projectName = `PROJECT ${buildingType.toUpperCase()} ${new Date().getFullYear()}`;
    const totalCool = round1(units.reduce((s, u) => s + u.cooling_kw, 0));
    const totalHeat = round1(units.reduce((s, u) => s + u.heating_kw, 0));
    const totalPipe = round1(units.length * rand(4, 10));

    return {
        project: {
            name: projectName,
            system: 'UE1',
            designConditions: '27.0°C B S, 19.0°C B H / 35.0°C B S',
            totalPipeLength: totalPipe,
            maxPipeLength: round1(totalPipe * 2),
            connectedUnits: numUnits,
            totalCooling: totalCool,
            totalHeating: totalHeat,
            requiredCooling: 0,
            requiredHeating: 0,
            connectedCapacity: `${randInt(150, 200)} / 210`,
            diversityFactor: '0%',
            additionalRefrigerant: round1(rand(0.5, 3)),
            totalRefrigerant: round1(rand(3, 8)),
        },
        outdoor: {
            model: outdoorModel,
            cooling_kw: outdoorCap.cool,
            heating_kw: outdoorCap.heat,
        },
        indoor: units,
        piping: pipingTree,
        electrical,
        wiringOutputs,
    };
}

/**
 * Build a deep hierarchical piping tree.
 * Returns a tree object (not flat array) where each node can have children.
 * Structure: { joint, gasSize, liquidSize, distance, children: [...] | unit: {...} }
 */
function buildDeepPipingTree(units) {
    const n = units.length;
    if (n === 0) return { joint: null, gasSize: '', liquidSize: '', distance: 0, children: [] };

    // Build binary-ish tree recursively
    const root = buildBranch(units, 0, true);
    return root;
}

function buildBranch(units, depth, isMainTrunk) {
    const n = units.length;

    // Pipe sizing gets smaller as we go deeper
    const gasSizes = ['5/8"', '1/2"', '3/8"'];
    const liquidSizes = ['3/8"', '1/4"', '1/4"'];
    const gasSize = gasSizes[Math.min(depth, gasSizes.length - 1)];
    const liquidSize = liquidSizes[Math.min(depth, liquidSizes.length - 1)];
    const distance = round1(isMainTrunk ? rand(8, 15) : rand(2, 6));

    if (n === 1) {
        // Leaf node — single unit
        return {
            joint: null,
            gasSize: gasSizes[Math.min(depth, gasSizes.length - 1)],
            liquidSize: liquidSizes[Math.min(depth, liquidSizes.length - 1)],
            distance: round1(rand(1.5, 5)),
            unit: units[0],
        };
    }

    if (n === 2) {
        // Two units — joint splits into two leaves
        return {
            joint: pick(JOINT_MODELS),
            gasSize,
            liquidSize,
            distance,
            children: [
                buildBranch([units[0]], depth + 1, false),
                buildBranch([units[1]], depth + 1, false),
            ],
        };
    }

    // More than 2 units — split into a "first branch" and "continue" branch
    // The reference diagram shows: joint → first group goes right, rest continues down
    const splitIdx = Math.max(1, Math.min(n - 1, randInt(1, Math.ceil(n / 2))));
    const firstBranch = units.slice(0, splitIdx);
    const restBranch = units.slice(splitIdx);

    return {
        joint: pick(JOINT_MODELS),
        gasSize,
        liquidSize,
        distance,
        children: [
            buildBranch(firstBranch, depth + 1, false),
            buildBranch(restBranch, depth + 1, false),
        ],
    };
}
