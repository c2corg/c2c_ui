import { describe, expect, it } from 'vitest';

import { cartoLayers, dataLayers, protectionAreasLayers } from './map-layers';
import { swissExtent } from './map-utils';

const isSwisstopo = (layer) =>
  layer
    .getSource()
    .getUrls()
    ?.some((url) => url.includes('.geo.admin.ch/'));

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
  }, 180000); // map-utils imports all the Font Awesome icons, see map-utils.spec.js
});
