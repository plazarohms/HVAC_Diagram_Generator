/* -------------------------------------------------------
   schema.js – constants & catalog data for HVAC systems
------------------------------------------------------- */

// Indoor unit types
export const UNIT_TYPES = ['cassette', 'ducted', 'wall', 'floor', 'slim-ducted'];

// Model catalogs keyed by type
export const INDOOR_MODELS = {
  cassette: ['FDTC15KXZE1-W', 'FDTC25KXZE1-W', 'FDTC35KXZE1-W', 'FDTC50KXZE1-W'],
  ducted: ['FDUM22KXE6F-W', 'FDUM28KXE6F-W', 'FDUM36KXE6F-W', 'FDUM45KXE6F-W'],
  wall: ['FDK15KXZE1-W', 'FDK25KXZE1-W', 'FDK35KXZE1-W', 'FDK50KXZE1-W'],
  floor: ['FDT56KXZE1-W', 'FDT71KXZE1-W', 'FDT100KXZE1-W'],
  'slim-ducted': ['FDUT15KXE6F-W', 'FDUT22KXE6F-W', 'FDUT28KXE6F-W'],
};

export const OUTDOOR_MODELS = [
  'FDC71KXZE1', 'FDC100KXZE1', 'FDC140KXZEN1-W',
  'FDC200KXZE1', 'FDC250KXZE1', 'FDC335KXZE1',
  'RXYQ8TY1', 'RXYQ10TY1', 'RXYQ12TY1', 'RXYQ16TY1',
  'RXYSO12TY1', 'RXYSO8TY1',
];

export const REMOTE_CONTROLLERS = [
  'RC-EX3A', 'RC-E5', 'BRC1H62W', 'BRC1H63W', 'SC-SL4-AE',
];

export const PIPE_SIZES = {
  liquid: ['1/4"', '3/8"', '1/2"'],
  gas: ['3/8"', '1/2"', '5/8"', '3/4"', '7/8"'],
};

export const JOINT_MODELS = ['DIS-22-1G', 'DIS-33-1G', 'DIS-44-1G'];

export const BREAKER_TYPES = ['Magnetotermico', 'Diferencial Interruptor'];

export const BUILDING_PREFIXES = {
  office: ['OFFICE', 'MEETING ROOM', 'RECEPTION', 'SERVER ROOM', 'LOBBY'],
  workshop: ['WORKSHOP FDUM', 'WORKSHOP FDUT', 'WORKSHOP FDTC', 'WORKSHOP FDK'],
  residential: ['LIVING ROOM', 'BEDROOM', 'KITCHEN', 'BATHROOM', 'HALLWAY'],
  commercial: ['SHOWROOM', 'STORE', 'CAFE', 'RESTAURANT', 'GYM'],
};

export const PHASES = ['1 Fase 220-240 v', '3 Fases 380-415 v'];

/**
 * Capacity table – approximate cooling / heating kW by model prefix.
 * We derive a realistic value from the model number digits.
 */
export function modelCapacity(model) {
  const m = model.match(/\d+/);
  if (!m) return { cool: 2.2, heat: 2.5 };
  const n = parseInt(m[0], 10);
  const cool = +(n * 0.1).toFixed(2);
  const heat = +(n * 0.11).toFixed(2);
  return { cool: Math.max(cool, 1.0), heat: Math.max(heat, 1.0) };
}
