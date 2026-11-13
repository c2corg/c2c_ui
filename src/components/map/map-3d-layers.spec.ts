import { addProtocol } from 'maplibre-gl';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { clearWhite, orthoLayerAt, orthoLayers, registerNoBlankProtocol, worldLayer } from './map-3d-layers';

vi.mock('maplibre-gl', () => ({ addProtocol: vi.fn() }));

// a width x height RGBA tile of one colour
const tile = (width: number, height: number, rgb: [number, number, number]) => {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) pixels.set([...rgb, 255], 4 * i);
  return pixels;
};
const alpha = (pixels: Uint8ClampedArray, width: number, x: number, y: number) => pixels[4 * (y * width + x) + 3];

describe('orthoLayerAt', () => {
  it.each([
    ['Grenoble', 5.72, 45.19, 'IGN ortho'],
    ['Zermatt', 7.75, 46.02, 'SwissTopo ortho'],
    ['Madrid', -3.7, 40.42, 'IGN ortho (es)'],
    ['Kathmandu', 85.32, 27.71, undefined],
  ])('%s', (_, lon, lat, title) => {
    expect(orthoLayerAt(lon, lat)?.title).toBe(title);
  });
});

describe('layers', () => {
  it('read the IGN France orthophoto through the protocol that drops its white', () => {
    const ign = orthoLayers.find((layer) => layer.title === 'IGN ortho')!;
    expect(ign.tiles[0]).toMatch(/^c2c-noblank:\/\/data\.geopf\.fr\/wmts\?/);
  });

  it('have a world layer with an attribution', () => {
    expect(worldLayer.tiles).toHaveLength(1);
    expect(worldLayer.attribution).toContain('Sentinel-2');
  });
});

describe('clearWhite', () => {
  it('keeps a photo as it is', () => {
    const pixels = tile(64, 64, [90, 120, 60]);
    expect(clearWhite(pixels, 64, 64)).toBe('none');
    expect(pixels.every((value, i) => i % 4 !== 3 || value === 255)).toBe(true);
  });

  it('finds a tile all white', () => {
    expect(clearWhite(tile(64, 64, [255, 255, 255]), 64, 64)).toBe('all');
  });

  it('keeps a snow field that is not pure white', () => {
    expect(clearWhite(tile(64, 64, [252, 253, 255]), 64, 64)).toBe('none');
  });

  it('clears the white beside the photo, and its near-white edge, but not further', () => {
    // left half pure white (outside France), right half photo with a near-white edge (JPEG) and near-white snow
    const width = 64;
    const pixels = tile(width, 64, [90, 120, 60]);
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 32; x++) pixels.set([255, 255, 255], 4 * (y * width + x));
      // the edge, next to the white
      pixels.set([250, 251, 249], 4 * (y * width + 32));
      pixels.set([249, 250, 252], 4 * (y * width + 33));
    }
    // snow inside the photo, more than a block away from the white
    for (let y = 0; y < 64; y++) for (let x = 52; x < 64; x++) pixels.set([250, 250, 250], 4 * (y * width + x));

    expect(clearWhite(pixels, width, 64)).toBe('some');
    expect(alpha(pixels, width, 0, 0)).toBe(0);
    expect(alpha(pixels, width, 31, 63)).toBe(0);
    expect(alpha(pixels, width, 32, 10)).toBe(0);
    expect(alpha(pixels, width, 33, 10)).toBe(0);
    expect(alpha(pixels, width, 34, 10)).toBe(255);
    expect(alpha(pixels, width, 60, 10)).toBe(255);
  });
});

describe('the c2c-noblank protocol', () => {
  type Handler = (params: { url: string }, abortController: AbortController) => Promise<{ data: ArrayBuffer }>;
  let handler: Handler;
  const transparent = new ArrayBuffer(3);

  beforeAll(() => {
    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        getContext() {
          return {};
        }
        convertToBlob() {
          return Promise.resolve({ arrayBuffer: () => Promise.resolve(transparent) });
        }
      }
    );
    registerNoBlankProtocol();
    registerNoBlankProtocol();
    expect(addProtocol).toHaveBeenCalledTimes(1);
    expect(vi.mocked(addProtocol).mock.calls[0][0]).toBe('c2c-noblank');
    handler = vi.mocked(addProtocol).mock.calls[0][1] as unknown as Handler;
  });

  afterEach(() => vi.unstubAllGlobals());

  it('asks the tile over https', async () => {
    const fetch = vi.fn().mockResolvedValue({ status: 404, ok: false });
    vi.stubGlobal('fetch', fetch);
    await handler({ url: 'c2c-noblank://example.org/tile?z=1' }, new AbortController());
    expect(fetch.mock.calls[0][0]).toBe('https://example.org/tile?z=1');
  });

  it('draws a missing tile transparent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 404, ok: false }));
    const { data } = await handler({ url: 'c2c-noblank://example.org/tile' }, new AbortController());
    expect(data).toBe(transparent);
  });

  it('fails on a server error, as MapLibre would', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 500, ok: false }));
    await expect(handler({ url: 'c2c-noblank://example.org/tile' }, new AbortController())).rejects.toThrow('500');
  });
});
