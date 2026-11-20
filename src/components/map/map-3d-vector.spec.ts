import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchStyle, prepareVectorMap, vectorMaps } from './map-3d-vector';

const style = (overrides: Partial<StyleSpecification> = {}): StyleSpecification => ({
  version: 8,
  glyphs: 'https://example.org/fonts/{fontstack}/{range}.pbf',
  sprite: 'https://example.org/sprite',
  sources: {
    base: { type: 'vector', url: 'https://example.org/base.json' },
    photo: { type: 'raster', tiles: ['https://example.org/{z}/{x}/{y}.jpeg'] },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': 'white' } },
    { id: 'photo', type: 'raster', source: 'photo' },
    { id: 'hillshade_grey', type: 'fill', source: 'base', 'source-layer': 'hillshade' },
    { id: 'water', type: 'fill', source: 'base', 'source-layer': 'water' },
    { id: 'peaks', type: 'symbol', source: 'base', 'source-layer': 'mountain_peak' },
    { id: 'roads', type: 'line', source: 'base', 'source-layer': 'transportation' },
  ],
  ...overrides,
});
const ids = (layers: LayerSpecification[]) => layers.map((layer) => layer.id);

describe('prepareVectorMap', () => {
  it('keeps the vector sources and their layers under the prefix, the names apart from the ground', () => {
    const prepared = prepareVectorMap({ styleUrl: '', keep: (layer) => layer.type !== 'background' }, style(), 'v-');

    expect(Object.keys(prepared.sources)).toEqual(['v-base']);
    // the background is left to the world layer; the raster layer goes with its source
    expect(ids(prepared.ground)).toEqual(['v-hillshade_grey', 'v-water', 'v-roads']);
    expect(ids(prepared.labels)).toEqual(['v-peaks']);
    expect(prepared.labels[0]).toMatchObject({ source: 'v-base', 'source-layer': 'mountain_peak' });
    expect(prepared.glyphs).toBe('https://example.org/fonts/{fontstack}/{range}.pbf');
    expect(prepared.sprites).toEqual([{ id: 'default', url: 'https://example.org/sprite' }]);
  });

  it('draws the swisstopo map on its countries, without its hillshade (ours is in 3D)', () => {
    const prepared = prepareVectorMap(vectorMaps.SwissTopo, style(), 'v-');

    expect(ids(prepared.ground)).toEqual(['v-ground', 'v-water', 'v-roads']);
    expect(prepared.ground[0]).toMatchObject({
      type: 'fill',
      source: 'v-base_v1.0.0',
      'source-layer': 'administrative_unit',
      filter: ['all', ['==', ['get', 'admin_level'], 2], ['in', ['get', 'iso_a2'], ['literal', ['CH', 'LI']]]],
    });
  });

  it('keeps the sprites of a style that has several, with their ids', () => {
    const sprite = [
      { id: 'default', url: 'https://example.org/a' },
      { id: 'other', url: 'https://example.org/b' },
    ];
    expect(prepareVectorMap(vectorMaps.SwissTopo, style({ sprite }), 'v-').sprites).toEqual(sprite);
    expect(prepareVectorMap(vectorMaps.SwissTopo, style({ sprite: undefined }), 'v-').sprites).toEqual([]);
  });
});

describe('fetchStyle', () => {
  afterEach(() => vi.restoreAllMocks());

  it('fetches a style once, and again after a failure', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValue(new Response(JSON.stringify(style())));

    await expect(fetchStyle('https://example.org/style.json')).rejects.toThrow('HTTP 503');
    await expect(fetchStyle('https://example.org/style.json')).resolves.toMatchObject({ version: 8 });
    await fetchStyle('https://example.org/style.json');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
