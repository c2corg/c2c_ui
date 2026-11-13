// the layers of the 3D view, as MapLibre sources.
// Only layers whose licence and service terms allow 3D use (assessment of 2026-11-10).
import { addProtocol } from 'maplibre-gl';

export type Layer3d = {
  // also the image of the layer button, in src/assets/img/layers
  title: string;
  image: string;
  country?: string;
  tiles: string[];
  maxzoom: number;
  // [west, south, east, north]: no tile request outside
  bounds?: [number, number, number, number];
  attribution: string;
};

const ignFr = (layer: string, format = 'jpeg') =>
  'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
  `&LAYER=${layer}&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/${format}`;

const swisstopo = (layer: string, format = 'jpeg') =>
  ['10', '11', '12', '13', '14'].map(
    (i) => `https://wmts${i}.geo.admin.ch/1.0.0/${layer}/default/current/3857/{z}/{x}/{y}.${format}`
  );

// IGN France answers outside France with white: a plain white tile, white beside the photo in the tiles of the
// border, or a 404 at some zooms. White is drawn transparent, so that the world layer shows there (the Italian side
// of the French border was white). Found by blocks of 16 x 16 pixels all pure white (a snow field is not that
// uniform), then grown pixel by pixel into the near-white pixels next to them, up to the edge of the photo, at most a
// block away (further, it would eat into the snow fields of the border). Only the tiles of the border pay for it: the
// other tiles are decoded and scanned once, without the second step.
const NO_BLANK = 'c2c-noblank';
const BLOCK = 16;
const WHITE = 255;
// the JPEG edge of the white part is a few levels below pure white
const NEAR_WHITE = 248;

let transparent: Promise<ArrayBuffer> | undefined;
const transparentTile = () => {
  if (!transparent) {
    // a canvas needs a context to be exported; a new one is transparent
    const canvas = new OffscreenCanvas(1, 1);
    canvas.getContext('2d');
    transparent = canvas.convertToBlob().then((blob) => blob.arrayBuffer());
  }
  return transparent;
};

/**
 * Makes the white of a decoded tile transparent (alpha 0), in place: the 16 x 16 blocks all pure white, then the
 * near-white pixels next to them, at most a block away. Says whether the tile has no white, is all white, or some.
 */
export function clearWhite(pixels: Uint8ClampedArray, width: number, height: number): 'none' | 'all' | 'some' {
  const white = (x: number, y: number) => {
    const i = 4 * (y * width + x);
    return pixels[i] >= WHITE && pixels[i + 1] >= WHITE && pixels[i + 2] >= WHITE;
  };
  let blanks = 0;
  let blocks = 0;
  for (let by = 0; by < height; by += BLOCK) {
    for (let bx = 0; bx < width; bx += BLOCK) {
      blocks++;
      let blank = true;
      for (let y = by; blank && y < Math.min(by + BLOCK, height); y++) {
        for (let x = bx; blank && x < Math.min(bx + BLOCK, width); x++) blank = white(x, y);
      }
      if (!blank) continue;
      blanks++;
      for (let y = by; y < Math.min(by + BLOCK, height); y++) {
        for (let x = bx; x < Math.min(bx + BLOCK, width); x++) pixels[4 * (y * width + x) + 3] = 0;
      }
    }
  }
  if (!blanks) return 'none';
  if (blanks === blocks) return 'all';
  // grow the transparent part into the near-white pixels it touches: each pixel is queued once at most
  const near = (i: number) =>
    pixels[4 * i + 3] !== 0 &&
    pixels[4 * i] >= NEAR_WHITE &&
    pixels[4 * i + 1] >= NEAR_WHITE &&
    pixels[4 * i + 2] >= NEAR_WHITE;
  const queue = new Int32Array(width * height);
  // the distance of each pixel to the white blocks, in steps
  const distance = new Uint8Array(width * height);
  let end = 0;
  for (let i = 0; i < width * height; i++) if (pixels[4 * i + 3] === 0) queue[end++] = i;
  for (let start = 0; start < end; start++) {
    const i = queue[start];
    if (distance[i] >= BLOCK) continue;
    const x = i % width;
    for (const j of [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i - width, i + width]) {
      if (j >= 0 && j < width * height && near(j)) {
        pixels[4 * j + 3] = 0;
        distance[j] = distance[i] + 1;
        queue[end++] = j;
      }
    }
  }
  return 'some';
}

async function withoutWhite(data: ArrayBuffer): Promise<ArrayBuffer> {
  const bitmap = await createImageBitmap(new Blob([data]));
  const { width, height } = bitmap;
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const image = context.getImageData(0, 0, width, height);
  const white = clearWhite(image.data, width, height);
  if (white === 'none') return data;
  if (white === 'all') return transparentTile();
  context.putImageData(image, 0, 0);
  return (await canvas.convertToBlob()).arrayBuffer();
}

let registered = false;

export function registerNoBlankProtocol(): void {
  if (registered) return;
  registered = true;
  addProtocol(NO_BLANK, async (params, abortController) => {
    const response = await fetch(params.url.replace(`${NO_BLANK}://`, 'https://'), {
      signal: abortController.signal,
    });
    if (response.status === 404) return { data: await transparentTile() };
    if (!response.ok) throw new Error(`tile ${params.url}: HTTP ${response.status}`);
    return { data: await withoutWhite(await response.arrayBuffer()) };
  });
}

const FRANCE_BOUNDS: [number, number, number, number] = [-5.5, 41.3, 9.7, 51.2];
const SWISS_BOUNDS: [number, number, number, number] = [5.96, 45.82, 10.49, 47.81];
const SPAIN_BOUNDS: [number, number, number, number] = [-9.5, 35.9, 4.4, 43.9];

// covers the whole world, also under the national orthophotos, past their borders
export const worldLayer: Layer3d = {
  // $gettext('Sentinel-2', 'Map layer')
  title: 'Sentinel-2',
  image: 's2cloudless.jpg',
  // 2016 mosaic: CC BY 4.0 (the later years are non commercial)
  tiles: ['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg'],
  maxzoom: 14,
  attribution:
    '<a href="https://s2maps.eu" target="_blank" rel="noreferrer noopener">Sentinel-2 cloudless 2016 by EOX</a>' +
    ' (Contains modified Copernicus Sentinel data 2016)',
};

export const orthoLayers: Layer3d[] = [
  {
    title: 'IGN ortho',
    image: 'ignortho.jpg',
    country: 'fr',
    tiles: [ignFr('ORTHOIMAGERY.ORTHOPHOTOS').replace('https://', `${NO_BLANK}://`)],
    maxzoom: 19,
    bounds: FRANCE_BOUNDS,
    attribution: '© IGN / Géoplateforme',
  },
  {
    title: 'SwissTopo ortho',
    image: 'swisstopoortho.jpg',
    country: 'ch',
    tiles: swisstopo('ch.swisstopo.swissimage'),
    maxzoom: 19,
    bounds: SWISS_BOUNDS,
    attribution: '© swisstopo',
  },
  {
    title: 'IGN ortho (es)',
    image: 'ignesortho.jpg',
    country: 'es',
    tiles: [
      'https://www.ign.es/wmts/pnoa-ma?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OI.OrthoimageCoverage' +
        '&STYLE=default&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg',
    ],
    maxzoom: 20,
    bounds: SPAIN_BOUNDS,
    attribution: 'Obra derivada de PNOA CC-BY 4.0 ign.es',
  },
];

export const slopeLayers: Layer3d[] = [
  {
    title: 'IGN Slopes',
    image: 'ignslopes.jpg',
    country: 'fr',
    tiles: [ignFr('GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN', 'png')],
    maxzoom: 17,
    bounds: FRANCE_BOUNDS,
    attribution: '© IGN',
  },
  {
    title: 'SwissTopo Slopes',
    image: 'swisstoposlopes.jpg',
    country: 'ch',
    tiles: swisstopo('ch.swisstopo.hangneigung-ueber_30', 'png'),
    maxzoom: 17,
    bounds: SWISS_BOUNDS,
    attribution: '© swisstopo',
  },
];

// the orthophoto of the country of a point, if we have one
export function orthoLayerAt(lon: number, lat: number): Layer3d | undefined {
  // Switzerland first: its box is inside the French one
  return [orthoLayers[1], orthoLayers[0], orthoLayers[2]].find(
    ({ bounds }) => bounds && lon >= bounds[0] && lon <= bounds[2] && lat >= bounds[1] && lat <= bounds[3]
  );
}

// colours of the relief layer, by elevation in metres: valleys green, rock brown and grey, snow white
export const reliefColors = [
  0,
  '#b7d39a',
  700,
  '#d9e0a6',
  1400,
  '#e6d3a3',
  2000,
  '#cfae8a',
  2600,
  '#b49c8c',
  3200,
  '#d6d6d6',
  3800,
  '#ffffff',
];
