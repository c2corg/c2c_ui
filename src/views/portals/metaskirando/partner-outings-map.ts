// What the map of /metaskirando draws, apart from the map library (PartnerOutingsMap.vue): where an outing is, how
// precisely, and in which colour. Nothing here knows OpenLayers or MapLibre, only the positions.
import type { PartnerOuting } from '@/js/apis/partner-outings-service';
import { toLonLat } from '@/js/geo/projection';

// the colour of the markers of a source: the text colour of its badge (SourceBadge.vue); c2c outings have the colour of
// the outings on the maps of the site
export const SOURCE_COLORS: Record<string, string> = {
  c2c: '#f93',
  skitour: '#1c5a8c',
  gulliver: '#1f6a35',
  gipfelbuch: '#54308a',
  bivouak: '#8a4100',
  skitourenportal: '#8f1c48',
  onice: '#0b5f6b',
};
export const OTHER_SOURCE_COLOR = '#444';

// the short label of the sources of the registry (c2c by the name of the site, as the old metaskirando); another source
// shows the name of its site if known, else its id
export const SOURCE_LABELS: Record<string, string> = {
  c2c: 'camptocamp.org',
  skitour: 'Skitour',
  gulliver: 'Gulliver',
  gipfelbuch: 'Gipfelbuch',
  bivouak: 'Bivouak',
  skitourenportal: 'Skitourenportal',
  onice: 'On-Ice',
};

export const sourceLabel = (source: string, siteName?: string) => SOURCE_LABELS[source] ?? (siteName || source);

export const sourceColor = (source: string) => SOURCE_COLORS[source] ?? OTHER_SOURCE_COLOR;

// the qualities of `geometry.quality` that tell the place of the outing only roughly: the centre of its area, or the
// summit it was resolved to (the start of the outing is somewhere around)
const APPROXIMATE_QUALITIES = ['area_centroid', 'summit'];

export const isApproximate = (outing: PartnerOuting) =>
  !!outing.geometry && APPROXIMATE_QUALITIES.includes(outing.geometry.quality);

type Coordinates = number | Coordinates[];

// the first position of GeoJSON coordinates (the start of a track)
function firstPosition(coordinates: Coordinates): number[] | null {
  if (!Array.isArray(coordinates)) {
    return null;
  }
  if (typeof coordinates[0] === 'number') {
    return coordinates as number[];
  }
  return firstPosition(coordinates[0]);
}

/** The place of an outing in longitude, latitude: its point, or the start of its line; null without a usable geometry. */
export function outingPosition(outing: PartnerOuting): [number, number] | null {
  if (!outing.geometry || outing.geometry.quality === 'none') {
    return null;
  }
  try {
    const geometry = JSON.parse(outing.geometry.geom) as { coordinates?: Coordinates };
    const position = geometry.coordinates && firstPosition(geometry.coordinates);
    if (!position || position.length < 2 || !position.every(Number.isFinite)) {
      return null;
    }
    // a finite projected position can still give an infinite longitude or latitude
    const [lon, lat] = toLonLat(position);
    return Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : null;
  } catch {
    return null;
  }
}

export type OutingMarker = { outing: PartnerOuting; position: [number, number]; approximate: boolean };

/** The outings that can be drawn, with their place, and how many cannot (no geometry) */
export function markersOf(outings: PartnerOuting[]): { markers: OutingMarker[]; withoutLocation: number } {
  const markers: OutingMarker[] = [];
  for (const outing of outings) {
    const position = outingPosition(outing);
    if (position) {
      markers.push({ outing, position, approximate: isApproximate(outing) });
    }
  }
  return { markers, withoutLocation: outings.length - markers.length };
}

/** The bbox parameter of the API: an extent in EPSG:3857, rounded to the metre */
export const bboxParam = (extent: number[]) => extent.map(Math.round);
