import type TileLayer from 'ol/layer/Tile';
import type UrlTile from 'ol/source/UrlTile';
import { describe, expect, it } from 'vitest';

import { cartoLayers, dataLayers, protectionAreasLayers } from './map-layers';
import { swissExtent } from './map-utils';

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
  }, 180000); // map-utils imports all the Font Awesome icons, see map-utils.spec.ts

  it('opens the attribution links in a new tab, without referrer', () => {
    const links = [...cartoLayers(), ...dataLayers(), ...protectionAreasLayers()].flatMap(attributionLinks);

    expect(links.length).toBeGreaterThan(10);
    for (const link of links) {
      expect([link.textContent, link.target, link.rel]).toEqual([link.textContent, '_blank', 'noreferrer noopener']);
    }
  });
});
