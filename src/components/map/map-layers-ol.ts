// The OpenLayers layers of the catalogue (map-layers.ts), for the maps still drawn by OpenLayers: the edition map and
// the Yeti portal
import { NO_BLANK, baseLayers, slopeLayers, swissProtectionLayers, type MapLayer } from './map-layers';

import { extentFromLonLat } from '@/js/geo/projection';
import ol from '@/js/libs/ol';

const HALF_SIZE = 20037508.342789244;

// the box of a tile in EPSG:3857, for the WMS layers
function tileBbox([z, x, y]: number[]) {
  const size = (2 * HALF_SIZE) / 2 ** z;
  return [-HALF_SIZE + x * size, HALF_SIZE - (y + 1) * size, -HALF_SIZE + (x + 1) * size, HALF_SIZE - y * size];
}

export function olLayer(layer: MapLayer, properties: Record<string, unknown> = {}) {
  const urls = layer.tiles.map((url) => url.replace(`${NO_BLANK}://`, 'https://'));
  const wms = urls[0].includes('{bbox-epsg-3857}');
  const retina = layer.tileSize === 128;
  return new ol.layer.Tile({
    properties: { title: layer.title, image: layer.image, country: layer.country, ...properties },
    visible: false,
    opacity: layer.opacity,
    // no tile requests outside the area of the layer, where the services serve blank tiles
    extent: layer.bounds && extentFromLonLat(layer.bounds),
    source: new ol.source.XYZ({
      attributions: [layer.attribution],
      ...(wms
        ? { tileUrlFunction: (coord) => urls[0].replace('{bbox-epsg-3857}', tileBbox(coord).join(',')) }
        : { urls }),
      minZoom: layer.minzoom,
      maxZoom: layer.maxzoom,
      tileSize: retina ? 128 : undefined,
      tilePixelRatio: retina ? 2 : undefined,
    }),
  });
}

export const cartoLayers = () =>
  baseLayers.map((layer, i) => {
    const olBaseLayer = olLayer(layer, { type: 'base' });
    // the first one is shown
    olBaseLayer.setVisible(i === 0);
    return olBaseLayer;
  });

// the opacity of the slopes can be changed
export const dataLayers = () => slopeLayers.map((layer) => olLayer(layer, { configurable: true }));

export const protectionAreasLayers = () => swissProtectionLayers.map((layer) => olLayer(layer));
