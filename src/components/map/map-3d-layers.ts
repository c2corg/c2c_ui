// What the 3D view adds to the layers of the catalogue (map-layers.ts): the protocol that drops the white of the IGN
// France orthophotos, the orthophoto of a place.
import { addProtocol } from 'maplibre-gl';

import { countriesAt, nationalOrthoLayers, NO_BLANK, type MapLayer } from './map-layers';

// IGN France answers outside France with white: a plain white tile, white beside the photo in the tiles of the
// border, or a 404 at some zooms. White is drawn transparent, so that the world layer shows there (the Italian side
// of the French border was white). Found by blocks of 16 x 16 pixels all pure white (a snow field is not that
// uniform), then grown pixel by pixel into the near-white pixels next to them, up to the edge of the photo, at most a
// block away (further, it would eat into the snow fields of the border). Only the tiles of the border pay for it: the
// other tiles are decoded and scanned once, without the second step.
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

// the orthophoto of the country of a point, if we have one in 3D
export function orthoLayerAt(lon: number, lat: number): MapLayer | undefined {
  for (const country of countriesAt(lon, lat)) {
    const layer = nationalOrthoLayers.find((ortho) => ortho.country === country);
    if (layer) return layer;
  }
  return undefined;
}

/**
 * The orthophoto of a track (the flyover): that of the country of the most of its points, about 200 of them read, if we
 * have one in 3D
 */
export function orthoLayerOf(points: number[][]): MapLayer | undefined {
  const counts = new Map<MapLayer, number>();
  const every = Math.max(1, Math.floor(points.length / 200));
  for (let i = 0; i < points.length; i += every) {
    const layer = orthoLayerAt(points[i][0], points[i][1]);
    if (layer) counts.set(layer, (counts.get(layer) ?? 0) + 1);
  }
  let best: MapLayer | undefined;
  for (const [layer, count] of counts) if (!best || count > counts.get(best)!) best = layer;
  return best;
}
