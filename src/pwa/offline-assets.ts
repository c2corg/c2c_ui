// What a document taken offline needs besides itself, at the urls the page asks for them: the images (Markdown.vue,
// Thumbnail.vue) and the OpenTopoMap tiles around it (map-layers.ts). Downloaded once into saved-assets.ts
import {
  baseLayers,
  countriesOfAreas,
  OFFLINE_BASE_LAYER,
  slopeLayers,
  type MapLayer,
} from '@/components/map/map-layers';
import config from '@/js/config';
import { extentFromLonLat } from '@/js/geo/projection';
import { getEmbeddedImageUrl, getImageUrl, type Image, type ImageFormat } from '@/js/image-urls';

// The format the browser takes in the <picture> of Thumbnail.vue and Markdown.vue: AVIF where it exists (no WebP:
// c2corg/c2c_images#1160), else the original.
// ponytail: a browser without avif (iOS before 16) has its images offline only for the older ones; add the other
// format if one asks, twice the space
const bestOf = (urlOf: (format?: ImageFormat) => string | undefined) => urlOf('avif') ?? urlOf();

// the images of a text: the ones of camptocamp ([img=123]) as Markdown.vue builds them, the others at their src
function textImageUrls(html: string) {
  if (!html.includes('<img')) {
    return [];
  }
  return [...new DOMParser().parseFromString(html, 'text/html').querySelectorAll('img')].map((img) => {
    const urlProxy = img.getAttribute('c2c:url-proxy');
    if (!urlProxy) {
      return img.getAttribute('src');
    }
    const urls = { url: img.getAttribute('c2c:url'), urlProxy };
    const modern =
      config.urls.modernThumbnailsId &&
      Number(img.getAttribute('c2c:document-id')) > config.urls.modernThumbnailsId &&
      img.getAttribute('c2c:size');
    return modern ? getEmbeddedImageUrl(urls, 'avif') : getEmbeddedImageUrl(urls);
  });
}

// The routes and the crags are where one looks at an image closely on the spot (the topo, the line): the BI images,
// the ones of the image viewer (ImageViewer.vue), of at most that many of their images. The ones of the text first,
// in its order, then the gallery's. The other documents keep only their MI ones: the viewer shows them instead.
const BIG_IMAGES_MAX = 30;

const takesBigImages = (document: { type?: string; waypoint_type?: string | null }) =>
  document.type === 'r' || (document.type === 'w' && document.waypoint_type === 'climbing_outdoor');

// the camptocamp images of a text ([img=123]), by their id
function textImageIds(html: string) {
  if (!html.includes('c2c:document-id')) {
    return [];
  }
  return [...new DOMParser().parseFromString(html, 'text/html').querySelectorAll('img[c2c\\:document-id]')]
    .map((img) => Number(img.getAttribute('c2c:document-id')))
    .filter((id) => Number.isInteger(id) && id > 0);
}

// the BI images as the viewer asks for them: the gallery's from their file name, the text's from their id only (the
// proxy of the API). An image of both may be asked for either way, whichever the page gave the viewer first: both.
function bigImageUrls(texts: string[], images: Image[]) {
  const inText = new Set(texts.flatMap(textImageIds));
  const inGallery = new Map(images.map((image) => [image.document_id, image]));
  const ids = [...new Set([...inText, ...inGallery.keys()])].slice(0, BIG_IMAGES_MAX);
  return ids.flatMap((id) => {
    const asked = [inGallery.get(id), inText.has(id) ? { document_id: id } : undefined];
    return asked.filter((image) => !!image).map((image) => bestOf((format) => getImageUrl(image, 'BI', format)));
  });
}

// the images of the text, and the thumbnails of the gallery (Gallery.vue); the BI ones of the routes and crags
export function imageUrlsOf(document: {
  type?: string;
  waypoint_type?: string | null;
  cooked?: Record<string, unknown> | null;
  associations?: { images?: Image[] } | null;
}) {
  const texts = Object.values(document.cooked ?? {}).filter((value): value is string => typeof value === 'string');
  const images = document.associations?.images ?? [];
  const thumbnails = images.map((image) => bestOf((format) => getImageUrl(image, 'MI', format)));
  const big = takesBigImages(document) ? bigImageUrls(texts, images) : [];
  const urls = [...thumbnails, ...texts.flatMap(textImageUrls), ...big];
  return [...new Set(urls.filter((url): url is string => !!url))];
}

// half the width of the world in web mercator (EPSG:3857, the projection of the geometries of the API), in meters
const HALF_WORLD = Math.PI * 6378137;
// from the valley to the path, and a margin around the geometry
const TILE_ZOOMS = [11, 12, 13, 14, 15];
const MARGIN = 2000;
// ponytail: a long route stops at the zoom where this is reached; the tiles of a corridor along it if one day it matters
const MAX_TILES = 250;

// the [x, y] of a GeoJSON geometry, whatever its type
type Geometry = { coordinates?: unknown; geometries?: Geometry[] };
const positions = (coordinates: unknown): number[][] =>
  Array.isArray(coordinates)
    ? typeof coordinates[0] === 'number'
      ? [coordinates as number[]]
      : coordinates.flatMap(positions)
    : [];
const pointsOf = (geometry: Geometry | null): number[][] =>
  geometry?.geometries ? geometry.geometries.flatMap(pointsOf) : positions(geometry?.coordinates);

// The OpenTopoMap tiles of the copies saved before the tiles of each layer (offlineTilesOf), as they were downloaded:
// what the copy of those documents to saved-assets.ts looks for
// ponytail: remove with migrateLegacyAssets, after 2027-02-20
export function tileUrlsOf(geometry?: { geom?: string | null; geom_detail?: string | null } | null) {
  let points: number[][];
  try {
    points = pointsOf(JSON.parse(geometry?.geom_detail ?? geometry?.geom ?? 'null'));
  } catch {
    return [];
  }
  if (!points.length) {
    return [];
  }
  // not Math.min(...): a detailed track has more points than a call takes arguments
  const [minX, minY, maxX, maxY] = points.reduce(
    ([x1, y1, x2, y2], [x, y]) => [Math.min(x1, x), Math.min(y1, y), Math.max(x2, x), Math.max(y2, y)],
    [Infinity, Infinity, -Infinity, -Infinity]
  );

  const urls: string[] = [];
  for (const z of TILE_ZOOMS) {
    const n = 2 ** z;
    const tile = (meters: number) =>
      Math.min(n - 1, Math.max(0, Math.floor(((meters + HALF_WORLD) / HALF_WORLD / 2) * n)));
    for (let x = tile(minX - MARGIN); x <= tile(maxX + MARGIN); x++) {
      // tiles count from the north
      for (let y = tile(-maxY - MARGIN); y <= tile(-minY + MARGIN); y++) {
        // a: the key of every tile in the cache, whatever server the map picks (tile-key.ts)
        urls.push(`https://a.tile.opentopomap.org/${z}/${x}/${y}.png`);
      }
    }
    if (urls.length >= MAX_TILES) {
      break;
    }
  }
  return urls.slice(0, MAX_TILES);
}

// --- the tiles of each map layer, for the documents saved offline ---

type Extent = [number, number, number, number];

// The layers a document takes offline, with the zooms of their tiles and a budget of tiles each. OpenTopoMap always;
// SwissTopo in Switzerland and Liechtenstein; the slopes for the activities on snow and ice, of the country; the map of
// the IGN of Spain in Spain, that of the ICGC in Catalonia. Not the IGN
// maps of France: their licence forbids keeping their tiles (conditions of the Géoplateforme, SCAN 25)
interface OfflineLayer {
  layer: MapLayer;
  zooms: number[];
  maxTiles: number;
}
const layerTitled = (title: string) => [...baseLayers, ...slopeLayers].find((layer) => layer.title === title)!;
const ZOOMS = [11, 12, 13, 14, 15];
const OPENTOPOMAP: OfflineLayer = { layer: layerTitled(OFFLINE_BASE_LAYER), zooms: ZOOMS, maxTiles: 400 };
// tiles of 128 px: the map shows the tiles of the next zoom, 4 times as many for the same ground
const SWISSTOPO: OfflineLayer = { layer: layerTitled('SwissTopo'), zooms: [12, 13, 14, 15, 16], maxTiles: 600 };
const SWISSTOPO_SLOPES: OfflineLayer = { layer: layerTitled('SwissTopo Slopes'), zooms: ZOOMS, maxTiles: 400 };
const IGN_SLOPES: OfflineLayer = { layer: layerTitled('IGN Slopes'), zooms: ZOOMS, maxTiles: 400 };
// CC BY 4.0, no limit on keeping their tiles (licences of the IGN of Spain, Orden FOM/2807/2015, and of the ICGC)
const IGN_ES: OfflineLayer = { layer: layerTitled('IGN raster (es)'), zooms: ZOOMS, maxTiles: 400 };
const ICGC: OfflineLayer = { layer: layerTitled('ICGC raster (ca)'), zooms: ZOOMS, maxTiles: 400 };

export const SLOPE_ACTIVITIES = ['skitouring', 'snowshoeing', 'snow_ice_mixed', 'ice_climbing'];

interface OfflineDocument {
  geometry?: { geom?: string | null; geom_detail?: string | null } | null;
  activities?: string[] | null;
  areas?: { document_id?: number; area_type?: string | null }[] | null;
  associations?: Record<string, unknown> | null;
}

export function offlineLayersOf(document: OfflineDocument): OfflineLayer[] {
  // Switzerland with Liechtenstein; Catalonia instead of Spain: the map of the ICGC only, more detailed there
  const countries = countriesOfAreas((document.areas ?? []).map((area) => area.document_id!));
  const swiss = countries.has('ch');
  const france = countries.has('fr');
  const spain = countries.has('es');
  const catalonia = countries.has('catalonia');
  const slopes = (document.activities ?? []).some((activity) => SLOPE_ACTIVITIES.includes(activity));
  return [
    OPENTOPOMAP,
    ...(swiss ? [SWISSTOPO] : []),
    ...(swiss && slopes ? [SWISSTOPO_SLOPES] : []),
    ...(france && slopes ? [IGN_SLOPES] : []),
    ...(spain ? [IGN_ES] : []),
    ...(catalonia ? [ICGC] : []),
  ];
}

// the bounding box of a WMS tile, written as MapLibre writes it (getTileBBox of maplibre-gl, src/tile/tile_id.ts): the
// same digits, or the cache would not find the tile the map asks for
function tileBBox(z: number, x: number, y: number) {
  const tilesAtZoom = Math.pow(2, z);
  const tileExtent = (2 * HALF_WORLD) / tilesAtZoom;
  const gridMinY = HALF_WORLD - 2 * HALF_WORLD;
  const rowFromBottom = tilesAtZoom - y - 1;
  return `${-HALF_WORLD + x * tileExtent},${gridMinY + rowFromBottom * tileExtent},${-HALF_WORLD + (x + 1) * tileExtent},${gridMinY + (rowFromBottom + 1) * tileExtent}`;
}

// the tile url of a layer, as the map asks for it (the first server: the cache keeps one key per tile, tile-key.ts)
const tileUrl = (layer: MapLayer, z: number, x: number, y: number) =>
  layer.tiles[0]
    .replace('{z}', String(z))
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('{bbox-epsg-3857}', () => tileBBox(z, x, y));

const tileExtent = (z: number, x: number, y: number): Extent => {
  const size = (2 * HALF_WORLD) / 2 ** z;
  return [-HALF_WORLD + x * size, HALF_WORLD - (y + 1) * size, -HALF_WORLD + (x + 1) * size, HALF_WORLD - y * size];
};

const tileIndex = (meters: number, z: number) =>
  Math.min(2 ** z - 1, Math.max(0, Math.floor(((meters + HALF_WORLD) / HALF_WORLD / 2) * 2 ** z)));

// the tiles of a zoom that cover an extent, in a layer's bounds
function tilesIn([minX, minY, maxX, maxY]: Extent, z: number, bounds?: Extent) {
  const tiles: [number, number][] = [];
  for (let x = tileIndex(minX, z); x <= tileIndex(maxX, z); x++) {
    for (let y = tileIndex(-maxY, z); y <= tileIndex(-minY, z); y++) {
      const [a, b, c, d] = tileExtent(z, x, y);
      if (!bounds || (a <= bounds[2] && c >= bounds[0] && b <= bounds[3] && d >= bounds[1])) {
        tiles.push([x, y]);
      }
    }
  }
  return tiles;
}

const distanceToSegment = ([px, py]: number[], [ax, ay]: number[], [bx, by]: number[]) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = dx || dy ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))) : 0;
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};
// from a tile to a segment: the closest point of the tile to the segment, approximated by clamping points along it
function tileNear(extent: Extent, a: number[], b: number[], distance: number) {
  const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / ((extent[2] - extent[0]) / 4)));
  for (let i = 0; i <= steps; i++) {
    const p = [a[0] + ((b[0] - a[0]) * i) / steps, a[1] + ((b[1] - a[1]) * i) / steps];
    const closest = [Math.min(Math.max(p[0], extent[0]), extent[2]), Math.min(Math.max(p[1], extent[1]), extent[3])];
    if (distanceToSegment(closest, a, b) <= distance) {
      return true;
    }
  }
  return false;
}

// The margin around the geometry and its waypoints, and when the whole of it is too many tiles for a zoom, the band
// along the track and the circle around its waypoints (the track may miss the hut, the access), or without a track the
// circles around its point and its waypoints: in meters on the ground
const BAND = 500;
const WAYPOINT_RADIUS = 1000;

// the tiles of a zoom within a distance of the track segments and of the waypoints
function bandTiles(z: number, track: number[][][], waypoints: number[][], scale: number, bounds?: Extent) {
  const keys = new Set<string>();
  const band = BAND * scale;
  const radius = WAYPOINT_RADIUS * scale;
  for (const line of track) {
    line.slice(1).forEach((b, i) => {
      const a = line[i];
      const around: Extent = [
        Math.min(a[0], b[0]) - band,
        Math.min(a[1], b[1]) - band,
        Math.max(a[0], b[0]) + band,
        Math.max(a[1], b[1]) + band,
      ];
      for (const [x, y] of tilesIn(around, z, bounds)) {
        if (!keys.has(`${x}/${y}`) && tileNear(tileExtent(z, x, y), a, b, band)) {
          keys.add(`${x}/${y}`);
        }
      }
    });
  }
  for (const [px, py] of waypoints) {
    for (const [x, y] of tilesIn([px - radius, py - radius, px + radius, py + radius], z, bounds)) {
      keys.add(`${x}/${y}`);
    }
  }
  return [...keys].map((key) => key.split('/').map(Number) as [number, number]);
}

const linesOf = (geometry: Geometry | null): number[][][] => {
  if (!geometry) return [];
  if (geometry.geometries) return geometry.geometries.flatMap(linesOf);
  const type = (geometry as { type?: string }).type;
  if (type === 'LineString') return [geometry.coordinates as number[][]];
  if (type === 'MultiLineString') return geometry.coordinates as number[][][];
  return [];
};

const parse = (json?: string | null): Geometry | null => {
  try {
    return JSON.parse(json ?? 'null');
  } catch {
    return null;
  }
};

// the points of the waypoints associated with the document
function waypointPoints(associations: OfflineDocument['associations']) {
  const waypoints = [
    ...((associations?.waypoints as { geometry?: { geom?: string | null } }[] | undefined) ?? []),
    ...((associations?.waypoint_children as { geometry?: { geom?: string | null } }[] | undefined) ?? []),
  ];
  return waypoints.flatMap((waypoint) => pointsOf(parse(waypoint.geometry?.geom)));
}

/**
 * The tiles of each layer a document takes offline: the extent of its geometry and its waypoints with a margin, zoom
 * after zoom; past the budget of a layer, the band along the track (or the circles around its points) for that zoom;
 * still past it, that layer stops at the zoom before. With the highest zoom kept of each layer, which the map offers
 * without a network.
 */
export function offlineTilesOf(document: OfflineDocument): { urls: string[]; layers: Record<string, number> } {
  const geometry = parse(document.geometry?.geom_detail) ?? parse(document.geometry?.geom);
  const points = pointsOf(geometry);
  if (!points.length) {
    return { urls: [], layers: {} };
  }
  const track = linesOf(parse(document.geometry?.geom_detail));
  // its waypoints too (access, hut, summit): a route without a track is a point, which may be far from them
  const waypoints = waypointPoints(document.associations);
  // without a track, the band is the circles around the point and the waypoints
  const bandPoints = track.length ? waypoints : [...points, ...waypoints];
  const extent = [...points, ...waypoints].reduce<Extent>(
    ([x1, y1, x2, y2], [x, y]) => [Math.min(x1, x), Math.min(y1, y), Math.max(x2, x), Math.max(y2, y)],
    [Infinity, Infinity, -Infinity, -Infinity]
  );
  const withMargin: Extent = [extent[0] - MARGIN, extent[1] - MARGIN, extent[2] + MARGIN, extent[3] + MARGIN];
  // meters of web mercator for a meter on the ground, at the latitude of the document
  const latitude = Math.atan(Math.sinh((extent[1] + extent[3]) / 2 / 6378137));
  const scale = 1 / Math.cos(latitude);

  const urls: string[] = [];
  const layers: Record<string, number> = {};
  for (const { layer, zooms, maxTiles } of offlineLayersOf(document)) {
    const bounds = layer.bounds && (extentFromLonLat(layer.bounds) as Extent);
    let budget = maxTiles;
    for (const z of zooms) {
      let tiles = tilesIn(withMargin, z, bounds);
      if (tiles.length > budget) {
        tiles = bandTiles(z, track, bandPoints, scale, bounds);
      }
      if (!tiles.length || tiles.length > budget) {
        break;
      }
      budget -= tiles.length;
      urls.push(...tiles.map(([x, y]) => tileUrl(layer, z, x, y)));
      layers[layer.title] = z;
    }
  }
  return { urls, layers };
}
