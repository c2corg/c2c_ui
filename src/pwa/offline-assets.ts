// What a document taken offline needs besides itself, at the urls the page asks for them: the images (Markdown.vue,
// Thumbnail.vue) and the OpenTopoMap tiles around it (map-layers.ts). Downloaded once, the service worker keeps them
import config from '@/js/config';
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

// the images of the text, and the thumbnails of the gallery (Gallery.vue)
export function imageUrlsOf(document: {
  cooked?: Record<string, unknown> | null;
  associations?: { images?: Image[] } | null;
}) {
  const texts = Object.values(document.cooked ?? {}).filter((value): value is string => typeof value === 'string');
  const thumbnails = (document.associations?.images ?? []).map((image) =>
    bestOf((format) => getImageUrl(image, 'MI', format))
  );
  const urls = [...thumbnails, ...texts.flatMap(textImageUrls)];
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
        // the server OpenLayers picks for the tile among {a-c} (ol/tileurlfunction.js)
        urls.push(`https://${'abc'[((x << z) + y) % 3]}.tile.opentopomap.org/${z}/${x}/${y}.png`);
      }
    }
    if (urls.length >= MAX_TILES) {
      break;
    }
  }
  return urls.slice(0, MAX_TILES);
}
