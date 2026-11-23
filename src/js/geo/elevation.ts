// Fills or corrects the elevations of a GPS track with a digital elevation model (DEM, "MNT" in French).
// The DEM is sampled in the browser (src/components/map/map-3d-terrain.ts): no API is needed, the track is saved as it
// is in geom_detail, with its new elevations.
import { mapPositions, toLonLat } from './projection';

/** Below this median difference with the DEM (m), the GPS has no offset worth correcting: the DEM itself is that rough */
export const OFFSET_THRESHOLD = 10;
/** A point further from the DEM than this (m), once the offset is removed, is a spike: it takes the DEM elevation */
export const SPIKE_THRESHOLD = 50;

export type ElevationFix = {
  elevations: number[];
  /** The constant offset of the GPS to the DEM (m), removed from the elevations kept; 0 when there is none */
  offset: number;
  /** The points that were without elevation, or spikes, and took the DEM elevation */
  replaced: number;
  /** True when the track had no elevation at all: all of them come from the DEM */
  filled: boolean;
};

type Positions = number[] | Positions[];
type Sampler = (points: [number, number][]) => Promise<ArrayLike<number>>;

// a GPS gives 0 (or nothing) where it has no elevation
const isGood = (elevation: number | undefined): elevation is number => elevation !== undefined && elevation !== 0;

// x, y and a time in seconds since 1970 (XYM): no elevation, which no GPS gives that high
const hasTimeOnly = (position: number[]) => position.length === 3 && position[2] > 1e8;

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * The elevations of a track, given its GPS elevations (undefined or 0 when unknown) and the DEM ones (NaN where the DEM
 * has none). A track without elevation takes those of the DEM. Else the constant offset of the GPS is removed, and the
 * points without elevation, or spiking out of the DEM, take the DEM elevation.
 */
export function fixElevations(gps: (number | undefined)[], dem: ArrayLike<number>): ElevationFix {
  const known = gps.flatMap((elevation, i) =>
    isGood(elevation) && Number.isFinite(dem[i]) ? [elevation - dem[i]] : []
  );
  // the DEM elevation, or the nearest one before, where the DEM has none; the GPS one, if nothing else
  let last: number | undefined;
  const fallback = gps.map((elevation, i) => {
    if (Number.isFinite(dem[i])) last = dem[i];
    return last ?? elevation ?? 0;
  });

  if (!known.length) {
    const elevations = fallback.map((elevation) => Math.round(elevation));
    return { elevations, offset: 0, replaced: gps.filter((elevation) => !isGood(elevation)).length, filled: true };
  }

  const medianOffset = median(known);
  const offset = Math.abs(medianOffset) >= OFFSET_THRESHOLD ? Math.round(medianOffset) : 0;
  let replaced = 0;
  const elevations = gps.map((elevation, i) => {
    const ground = Number.isFinite(dem[i]) ? dem[i] : undefined;
    if (!isGood(elevation)) {
      replaced++;
      return Math.round(ground ?? fallback[i]);
    }
    const corrected = elevation - offset;
    if (ground !== undefined && Math.abs(corrected - ground) > SPIKE_THRESHOLD) {
      replaced++;
      return Math.round(ground);
    }
    return Math.round(corrected);
  });
  return { elevations, offset, replaced, filled: false };
}

/**
 * The coordinates (EPSG:3857, as in geom_detail) of a track with the elevations fixed: the times after the elevation
 * are kept. The result has the same nesting. `sample` gives the DEM elevations of points [longitude, latitude].
 */
export async function fixGeometryElevations<T extends Positions>(
  coordinates: T,
  sample: Sampler
): Promise<{ coordinates: T } & Omit<ElevationFix, 'elevations'>> {
  const positions: number[][] = [];
  mapPositions(coordinates, (position) => {
    positions.push(position);
    return position;
  });
  const dem = await sample(positions.map((position) => toLonLat(position).slice(0, 2) as [number, number]));
  const { elevations, ...stats } = fixElevations(
    positions.map((position) => (hasTimeOnly(position) ? undefined : position[2])),
    dem
  );
  let index = 0;
  const fixed = mapPositions(coordinates, (position) => {
    const [x, y, ...rest] = position;
    // XYM: the time was in the place of the elevation
    return [x, y, elevations[index++], ...(hasTimeOnly(position) ? rest : rest.slice(1))];
  });
  return { coordinates: fixed, ...stats };
}
