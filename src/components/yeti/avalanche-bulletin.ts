import { MICRO_REGION_POINTS } from '@/components/yeti/eaws-micro-regions';
import type { DangerRating, DangerRatingValue, ValidTimePeriod } from '@/js/apis/avalanche-bulletin-service';

// The bulletin zones of api.ensg.eu (France, by name) and the massifs of Météo-France, whose numbers are the EAWS
// region ids FR-01 to FR-74. Andorra (71) has its own service. Goes away with the EAWS regions on the map (#5171).
const FRENCH_MASSIFS: Record<string, number> = {
  Chablais: 1,
  Aravis: 2,
  'Mont-Blanc': 3,
  Bauges: 4,
  Beaufortain: 5,
  'Haute-Tarentaise': 6,
  Chartreuse: 7,
  Belledonne: 8,
  Maurienne: 9,
  Vanoise: 10,
  'Haute-Maurienne': 11,
  'Grandes-Rousses': 12,
  Thabor: 13,
  Vercors: 14,
  Oisans: 15,
  Pelvoux: 16,
  Queyras: 17,
  Devoluy: 18,
  Champsaur: 19,
  'Embrunais-Parpaillon': 20,
  Ubaye: 21,
  'Haut-Var-Haut-Verdon': 22,
  Mercantour: 23,
  'Cinto-Rotondo': 40,
  'Renoso-Incudine': 41,
  'Pays-Basque': 64,
  'Aspe-Ossau': 65,
  'Haute-Bigorre': 66,
  'Aure-Louron': 67,
  Luchonnais: 68,
  Couserans: 69,
  'Haute-Ariege': 70,
  'Orlu-St-Barthelemy': 72,
  'Capcir-Puymorens': 73,
  'Cerdagne-Canigou': 74,
};

/** A bulletin zone of api.ensg.eu; `contains` tells whether a point ([lon, lat]) is in it */
export type BulletinZone = {
  country?: string | null;
  name?: string | null;
  // the EAWS id of its service (CH, IT-23…), none for the French massifs
  numZone?: string | null;
  contains?: (lonLat: [number, number]) => boolean;
};

/**
 * The EAWS region id of a bulletin zone of the map, null when the c2c API has no bulletin for it: the French massif,
 * else a micro-region the zone covers (its micro-regions all have the same bulletin)
 */
export function bulletinRegionId({ country, name, numZone, contains }: BulletinZone): string | null {
  if (country === 'France') {
    const massif = name ? FRENCH_MASSIFS[name] : undefined;
    return massif ? `FR-${String(massif).padStart(2, '0')}` : null;
  }
  if (!numZone || !contains) {
    return null;
  }
  const regionId = Object.keys(MICRO_REGION_POINTS).find(
    (id) => id.startsWith(`${numZone}-`) && contains(MICRO_REGION_POINTS[id])
  );
  return regionId ?? null;
}

const DANGER_NUMBERS: Partial<Record<DangerRatingValue, number>> = {
  low: 1,
  moderate: 2,
  considerable: 3,
  high: 4,
  very_high: 5,
};

export function dangerNumber(value?: DangerRatingValue): number | undefined {
  return value ? DANGER_NUMBERS[value] : undefined;
}

/**
 * The danger at an elevation (the highest point of a route): the highest of the ratings whose elevation band holds it,
 * morning and afternoon. The highest of all when the elevation is unknown, or no band can tell (treeline bounds).
 */
export function dangerAtElevation(ratings: DangerRating[] = [], elevation?: number | null): number | undefined {
  const numbers = (rs: DangerRating[]) => rs.map((r) => dangerNumber(r.mainValue) ?? 0);
  const all = numbers(ratings);
  const max = all.length ? Math.max(...all) || undefined : undefined;
  if (elevation === null || elevation === undefined) {
    return max;
  }
  // a bound in meters, or null when it cannot be compared (treeline)
  const meters = (bound?: string) => (bound === undefined ? undefined : /^\d+$/.test(bound) ? Number(bound) : null);
  const holding = ratings.filter((r) => {
    const [lower, upper] = [meters(r.elevation?.lowerBound), meters(r.elevation?.upperBound)];
    return (
      lower !== null &&
      upper !== null &&
      (lower === undefined || elevation >= lower) &&
      (upper === undefined || elevation < upper)
    );
  });
  return holding.length ? Math.max(...numbers(holding)) || undefined : max;
}

/** The input of DangerLevel.vue: the altitude is its label, as api.ensg.eu gives it */
export type DangerLevelInput = {
  low?: number;
  high?: number;
  altitude?: string;
  lowEvol?: number;
  highEvol?: number;
};

/** The danger ratings as DangerLevel draws them: below and above the elevation threshold, and their afternoon change */
export function toDangerLevel(ratings: DangerRating[] = []): DangerLevelInput {
  const ofPeriod = (period: ValidTimePeriod) => ratings.filter((r) => (r.validTimePeriod ?? 'all_day') === period);
  const later = ofPeriod('later');
  const earlier = later.length ? ofPeriod('earlier') : ofPeriod('all_day');
  const below = (rs: DangerRating[]) => rs.find((r) => !r.elevation?.lowerBound);
  const above = (rs: DangerRating[]) => rs.find((r) => r.elevation?.lowerBound);
  // the afternoon value, when it changes
  const evolution = (morning?: DangerRating, afternoon?: DangerRating) => {
    const value = dangerNumber(afternoon?.mainValue);
    return value !== dangerNumber(morning?.mainValue) ? value : undefined;
  };

  const [morningBelow, morningAbove] = [below(earlier), above(earlier)];
  if (morningBelow && morningAbove) {
    return {
      low: dangerNumber(morningBelow.mainValue),
      high: dangerNumber(morningAbove.mainValue),
      altitude: `${morningAbove.elevation!.lowerBound} m`,
      lowEvol: later.length ? evolution(morningBelow, below(later)) : undefined,
      highEvol: later.length ? evolution(morningAbove, above(later)) : undefined,
    };
  }
  const single = morningBelow ?? morningAbove;
  return {
    low: dangerNumber(single?.mainValue),
    lowEvol: later.length ? evolution(single, later[0]) : undefined,
  };
}

/** A text of a bulletin without its HTML (<br/>, and SLF's headings and lists), its lines kept */
export function plainText(text?: string): string {
  if (!text) {
    return '';
  }
  const lines = text.replace(/<br\s*\/?>|<\/(?:p|li|div|h[1-6])>/gi, '\n').replace(/<li(?:\s[^>]*)?>/gi, '• ');
  // parsed, not rendered: nothing runs
  const plain = new DOMParser().parseFromString(lines, 'text/html').body.textContent ?? '';
  return plain.replace(/\n\s*\n+/g, '\n').trim();
}
