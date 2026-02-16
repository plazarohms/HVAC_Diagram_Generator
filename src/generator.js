/* -------------------------------------------------------
   generator.js – random HVAC configuration generator
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
 * @param {object} opts
 * @param {number} opts.numUnits       – number of indoor units (1-16)
 * @param {number} opts.systemCapacity – approx total cooling kW
 * @param {string} opts.buildingType   – office | workshop | residential | commercial
 * @param {number} opts.numOutputs     – number of wiring outputs (for wiring diagram)
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
    const roomPrefix = buildingType === 'workshop' ? '' : null;

    for (let i = 0; i < numUnits; i++) {
        const unitType = pick(UNIT_TYPES);
        const models = INDOOR_MODELS[unitType];
        const model = pick(models);
        const cap = modelCapacity(model);
        const scaleFactor = systemCapacity / (numUnits * 2.5);
        const cool = round1(cap.cool * Math.max(0.8, Math.min(1.5, scaleFactor)));
        const heat = round1(cap.heat * Math.max(0.8, Math.min(1.5, scaleFactor)));

        const roomName = roomPrefix === null
            ? `${pick(rooms)} ${i + 1}`
            : rooms[i % rooms.length];
        const locationCode = `S/L${String(i).padStart(2, '0')}`;

        units.push({
            id: nextId(),
            index: i + 1,
            type: unitType,
            model,
            cooling_kw: cool,
            heating_kw: heat,
            room: roomName,
            location: locationCode,
            remote: pick(REMOTE_CONTROLLERS),
        });
    }

    // Piping (tree structure)
    const piping = buildPipingTree(units);

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

    // Wiring outputs (for wiring diagram)
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
    const totalPipe = round1(units.length * rand(3, 8));

    return {
        project: {
            name: projectName,
            system: 'UE1',
            designConditions: '27.0 C B S, 19.0 C B H / 35.0 C B S',
            totalPipeLength: totalPipe,
            maxPipeLength: round1(totalPipe * 1.8),
            connectedUnits: numUnits,
            totalCooling: totalCool,
            totalHeating: totalHeat,
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
        piping,
        electrical,
        wiringOutputs,
    };
}

/* Build a realistic piping tree from outdoor to indoor units */
function buildPipingTree(units) {
    const segments = [];
    const n = units.length;

    // Main trunk
    const trunkLiquid = pick(PIPE_SIZES.liquid);
    const trunkGas = pick(PIPE_SIZES.gas);
    segments.push({
        from: 'outdoor',
        to: 'joint_main',
        joint: pick(JOINT_MODELS),
        liquidSize: trunkLiquid,
        gasSize: trunkGas,
        distance: round1(rand(5, 15)),
    });

    if (n <= 3) {
        // Direct branches
        units.forEach((u, i) => {
            segments.push({
                from: 'joint_main',
                to: `unit_${u.id}`,
                joint: i < n - 1 ? pick(JOINT_MODELS) : null,
                liquidSize: pick(PIPE_SIZES.liquid),
                gasSize: pick(PIPE_SIZES.gas),
                distance: round1(rand(2, 8)),
            });
        });
    } else {
        // Group into sub-branches
        const groups = [];
        let idx = 0;
        while (idx < n) {
            const size = Math.min(randInt(2, 4), n - idx);
            groups.push(units.slice(idx, idx + size));
            idx += size;
        }
        groups.forEach((grp, gi) => {
            const branchJoint = `joint_b${gi}`;
            segments.push({
                from: 'joint_main',
                to: branchJoint,
                joint: pick(JOINT_MODELS),
                liquidSize: pick(PIPE_SIZES.liquid),
                gasSize: pick(PIPE_SIZES.gas),
                distance: round1(rand(3, 8)),
            });
            grp.forEach((u, ui) => {
                segments.push({
                    from: branchJoint,
                    to: `unit_${u.id}`,
                    joint: ui < grp.length - 1 ? pick(JOINT_MODELS) : null,
                    liquidSize: pick(PIPE_SIZES.liquid),
                    gasSize: pick(PIPE_SIZES.gas),
                    distance: round1(rand(1, 6)),
                });
            });
        });
    }

    return segments;
}
