import type { Map as MapLibreMap } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import { exposeTransform } from './map-3d-flight-layers';

const asMap = (value: object) => value as unknown as MapLibreMap;

describe('exposeTransform (deck.gl 9.4 reads map.transform)', () => {
  it('leaves a map that has it', () => {
    const transform = {};
    const map = { transform };
    expect(exposeTransform(asMap(map))).toBe(true);
    expect(map.transform).toBe(transform);
  });

  it('gives the transform of the camera of MapLibre 6, kept up to date', () => {
    const camera = { transform: { zoom: 1 } };
    const map = asMap({ _camera: camera }) as unknown as { transform: { zoom: number } };
    expect(exposeTransform(map as unknown as MapLibreMap)).toBe(true);
    expect(map.transform.zoom).toBe(1);
    camera.transform = { zoom: 2 };
    expect(map.transform.zoom).toBe(2);
  });

  it('refuses a map without it: the flights then stay draped', () => {
    expect(exposeTransform(asMap({}))).toBe(false);
    expect(exposeTransform(asMap({ _camera: {} }))).toBe(false);
  });
});
