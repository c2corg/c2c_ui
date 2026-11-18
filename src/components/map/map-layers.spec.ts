import type TileLayer from 'ol/layer/Tile';
import type UrlTile from 'ol/source/UrlTile';
import { describe, expect, it } from 'vitest';

import { orthoLayers, swissExtent } from './map-layers';
import { cartoLayers, dataLayers, protectionAreasLayers } from './map-layers-ol';

const isSwisstopo = (layer: TileLayer<UrlTile>) =>
  layer
    .getSource()!
    .getUrls()
    ?.some((url) => url.includes('.geo.admin.ch/'));

// the links of the attributions of a layer
const attributionLinks = (layer: TileLayer<UrlTile>) =>
  [layer.getSource()!.getAttributions()!({} as never)]
    .flat()
    .flatMap((html) => [...new DOMParser().parseFromString(html, 'text/html').querySelectorAll('a')]);

describe('map-layers', () => {
  it('limits the swisstopo layers to Switzerland', () => {
    // the protection areas layers are visible on every map: without an extent, they load tiles everywhere
    const layers = [...cartoLayers(), ...dataLayers(), ...protectionAreasLayers()].filter(isSwisstopo);

    expect(layers.map((layer) => layer.get('title'))).toEqual([
      'SwissTopo',
      'SwissTopo ortho',
      'SwissTopo Slopes',
      'Swiss tranquility zones',
      'Swiss fauna protection zones',
    ]);
    layers.forEach((layer) => expect(layer.getExtent()).toEqual(swissExtent));
  });

  it('opens the attribution links in a new tab, without referrer', () => {
    const links = [...cartoLayers(), ...dataLayers(), ...protectionAreasLayers()].flatMap(attributionLinks);

    expect(links.length).toBeGreaterThan(10);
    for (const link of links) {
      expect([link.textContent, link.target, link.rel]).toEqual([link.textContent, '_blank', 'noreferrer noopener']);
    }
  });

  it('offers the public transport map as a base layer, after the first two', () => {
    const titles = cartoLayers().map((layer) => layer.get('title'));

    expect(titles.slice(0, 3)).toEqual(['OpenTopoMap', 'ESRI World Imagery', 'Public transport']);
    const layer = cartoLayers()[2] as TileLayer<UrlTile>;
    expect(layer.getSource()!.getUrls()).toEqual([
      'https://media.camptocamp.org/public-transport/tiles/{z}/{x}/{y}.png',
    ]);
    expect(layer.getVisible()).toBe(false);
  });

  it('offers the public transport map in 3D without making it the default one', () => {
    expect(orthoLayers.map((layer) => layer.title)).toContain('Public transport');
    // the 3D view opens on the orthophoto of a country, which this layer has none of
    expect(orthoLayers.find((layer) => layer.title === 'Public transport')!.country).toBeUndefined();
  });
});
