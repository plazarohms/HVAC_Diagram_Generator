/* -------------------------------------------------------
   generator.js – random HVAC configuration generator
   Produces deep hierarchical piping trees matching
   manufacturer style diagrams. Supports multiple outdoor units.
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
 * Supports multiple outdoor units — indoor units are distributed across them.
 */
export function generateSystem(opts = {}) {
    _id = 0;
    const numUnits = opts.numUnits ?? 6;
    const numOutdoor = opts.numOutdoor ?? 1;
    const systemCapacity = opts.systemCapacity ?? 14;
    const buildingType = opts.buildingType ?? 'office';
    const numOutputs = opts.numOutputs ?? 1;

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

    // Distribute indoor units across outdoor units
    const systems = [];
    const unitsPerOutdoor = Math.ceil(numUnits / numOutdoor);

    for (let o = 0; o < numOutdoor; o++) {
        const start = o * unitsPerOutdoor;
        const end = Math.min(start + unitsPerOutdoor, numUnits);
        const subset = units.slice(start, end);
        if (subset.length === 0) continue;

        const outdoorModel = pick(OUTDOOR_MODELS);
        const outdoorCap = modelCapacity(outdoorModel);
        const pipingTree = buildDeepPipingTree(subset);

        const subsetCool = round1(subset.reduce((s, u) => s + u.cooling_kw, 0));
        const subsetHeat = round1(subset.reduce((s, u) => s + u.heating_kw, 0));

        systems.push({
            outdoor: {
                model: outdoorModel,
                cooling_kw: outdoorCap.cool,
                heating_kw: outdoorCap.heat,
            },
            indoor: subset,
            piping: pipingTree,
            totalCooling: subsetCool,
            totalHeating: subsetHeat,
        });
    }

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
        // BACKWARD COMPAT: keep single outdoor for renderers that use it
        outdoor: systems[0] ? systems[0].outdoor : { model: '', cooling_kw: 0, heating_kw: 0 },
        indoor: units,
        piping: systems[0] ? systems[0].piping : {},
        // NEW: array of outdoor systems
        systems: systems,
        electrical,
    };
}

/**
 * Build a deep hierarchical piping tree.
 */
function buildDeepPipingTree(units) {
    const n = units.length;
    if (n === 0) return { joint: null, gasSize: '', liquidSize: '', distance: 0, children: [] };
    const root = buildBranch(units, 0, true);
    return root;
}

function buildBranch(units, depth, isMainTrunk) {
    const n = units.length;

    const gasSizes = ['5/8"', '1/2"', '3/8"'];
    const liquidSizes = ['3/8"', '1/4"', '1/4"'];
    const gasSize = gasSizes[Math.min(depth, gasSizes.length - 1)];
    const liquidSize = liquidSizes[Math.min(depth, liquidSizes.length - 1)];
    const distance = round1(isMainTrunk ? rand(8, 15) : rand(2, 6));

    if (n === 1) {
        return {
            joint: null,
            gasSize: gasSizes[Math.min(depth, gasSizes.length - 1)],
            liquidSize: liquidSizes[Math.min(depth, liquidSizes.length - 1)],
            distance: round1(rand(1.5, 5)),
            unit: units[0],
        };
    }

    if (n === 2) {
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
