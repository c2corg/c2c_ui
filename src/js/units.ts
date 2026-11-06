// Meters or feet, kilometers or miles: what the documents show, as the user chose in the settings of the app
// (src/stores/app-settings.ts). The documents keep their metric values: only their display changes.
export const UNIT_SYSTEMS = ['metric', 'imperial'] as const;
export type UnitSystem = (typeof UNIT_SYSTEMS)[number];

const FEET_PER_METER = 3.28084;
const MILES_PER_KM = 0.621371;

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * A value of a field and its unit as shown: converted when the system is imperial and the unit is m or km, else as it
 * is (divided by divisor, as the fields of the documents do).
 */
export function displayValueAndUnit(value: unknown, unit: string, divisor: number | null, system?: UnitSystem) {
  const metric = { value: divisor && typeof value === 'number' ? Math.round(value / divisor) : value, unit };
  if (system !== 'imperial' || typeof value !== 'number' || !Number.isFinite(value)) {
    return metric;
  }
  if (unit === 'km') {
    return { value: round1((divisor ? value / divisor : value) * MILES_PER_KM), unit: 'mi' };
  }
  if (unit === 'm') {
    return { value: Math.round(value * FEET_PER_METER), unit: 'ft' };
  }
  return metric;
}

// a distance given in meters, in km or miles
export const distance = (meters: number, system?: UnitSystem) =>
  system === 'imperial'
    ? { value: round1((meters / 1000) * MILES_PER_KM), unit: 'mi' }
    : { value: round1(meters / 1000), unit: 'km' };

// an elevation (or a gain) given in meters, in m or ft
export const elevation = (meters: number, system?: UnitSystem) =>
  system === 'imperial'
    ? { value: Math.round(meters * FEET_PER_METER), unit: 'ft' }
    : { value: Math.round(meters), unit: 'm' };
