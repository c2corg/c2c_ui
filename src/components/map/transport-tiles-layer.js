// Public transport lines and stops, read from a PMTiles file generated from OpenStreetMap
// (see transport_tiles/ in the API repository). The file holds two layers:
// `lines` (ref, name, network, operator, colour, mode...) and `stops` (name, lines, modes...).
import { PMTilesVectorSource } from 'ol-pmtiles';

import config from '@/js/config';
import ol from '@/js/libs/ol';
import { normalizeColour } from '@/js/transport-utils';

export const TRANSPORT_TILES_FILE = 'transport.pmtiles';

// the tiles hold no line below this zoom (the layer is shown above it)
export const TRANSPORT_MIN_ZOOM = 5;

// a line is thin: be lenient when pointing at it
export const TRANSPORT_HIT_TOLERANCE = 6;

const LABEL_MIN_ZOOM = 12;
const STOP_NAME_MIN_ZOOM = 15;

const MODE_COLOURS = {
  train: '#4a5568',
  subway: '#7a49c9',
  tram: '#cf3a3a',
  light_rail: '#cf3a3a',
  monorail: '#7a49c9',
  funicular: '#d9730d',
  aerialway: '#d9730d',
  ferry: '#1f9bd1',
  bus: '#1f6fd1',
  trolleybus: '#1f6fd1',
};
const DEFAULT_COLOUR = '#1f6fd1';

// [line width in pixels, line dash]
const MODE_STROKES = {
  train: [3, [10, 4]],
  funicular: [3, [10, 4]],
  aerialway: [2, [2, 6]],
  ferry: [2, [4, 6]],
};
const DEFAULT_STROKE = [2.5, undefined];

const ATTRIBUTIONS = [
  '© <a target="_blank" rel="noreferrer noopener" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  '<a target="_blank" rel="noreferrer noopener" href="https://www.navitia.io">Navitia</a>',
];

export function transportTilesUrl() {
  return import.meta.env.VITE_TRANSPORT_TILES_URL || `${config.urls.media}/${TRANSPORT_TILES_FILE}`;
}

// zoom of the web mercator map, from the resolution given to style functions
function zoomOf(resolution) {
  return Math.log2(156543.03392804097 / resolution);
}

const styleCache = new Map();

function cached(key, create) {
  let style = styleCache.get(key);
  if (!style) {
    style = create();
    styleCache.set(key, style);
  }
  return style;
}

function lineStyles(colour, width, dash, emphasis) {
  return cached(`line|${colour}|${width}|${dash}|${emphasis}`, () => [
    new ol.style.Style({
      stroke: new ol.style.Stroke({ color: 'rgba(255, 255, 255, 0.9)', width: width + 3 }),
      zIndex: emphasis ? 11 : 1,
    }),
    new ol.style.Style({
      stroke: new ol.style.Stroke({ color: colour, width, lineDash: dash, lineCap: 'butt' }),
      zIndex: emphasis ? 12 : 2,
    }),
  ]);
}

function lineLabel(ref, colour) {
  return cached(
    `label|${ref}|${colour}`,
    () =>
      new ol.style.Style({
        text: new ol.style.Text({
          text: ref,
          placement: 'line',
          font: '600 12px sans-serif',
          fill: new ol.style.Fill({ color: '#111111' }),
          stroke: new ol.style.Stroke({ color: '#ffffff', width: 3 }),
          overflow: false,
        }),
        zIndex: 13,
      })
  );
}

// colour of a line: the one of its OpenStreetMap tags, or one by mode
export function transportLineColour(properties) {
  return normalizeColour(properties.colour, MODE_COLOURS[properties.mode] ?? DEFAULT_COLOUR);
}

function stopStyle(zoom) {
  const radius = zoom >= 14 ? 5 : 4;
  return cached(
    `stop|${radius}`,
    () =>
      new ol.style.Style({
        image: new ol.style.Circle({
          radius,
          fill: new ol.style.Fill({ color: '#ffffff' }),
          stroke: new ol.style.Stroke({ color: '#2d3748', width: 2 }),
        }),
        zIndex: 20,
      })
  );
}

function stopName(name) {
  return cached(
    `stopname|${name}`,
    () =>
      new ol.style.Style({
        text: new ol.style.Text({
          text: name,
          font: '12px sans-serif',
          offsetY: -14,
          fill: new ol.style.Fill({ color: '#111111' }),
          stroke: new ol.style.Stroke({ color: '#ffffff', width: 3 }),
        }),
        zIndex: 21,
      })
  );
}

/**
 * Style of a feature of the tiles. `state` holds the ids of the line under the pointer (hoveredId) and of the line that
 * was clicked (selectedId).
 */
export function transportStyle(feature, resolution, state) {
  const zoom = zoomOf(resolution);

  if (feature.get('layer') === 'stops') {
    if (zoom < 12) {
      return null;
    }
    const styles = [stopStyle(zoom)];
    if (zoom >= STOP_NAME_MIN_ZOOM && feature.get('name')) {
      styles.push(stopName(feature.get('name')));
    }
    return styles;
  }

  const colour = transportLineColour(feature.getProperties());
  const [baseWidth, dash] = MODE_STROKES[feature.get('mode')] ?? DEFAULT_STROKE;
  const emphasis = feature.getId() !== undefined && [state.hoveredId, state.selectedId].includes(feature.getId());
  const width = (zoom < 9 ? baseWidth * 0.8 : zoom >= 13 ? baseWidth * 1.3 : baseWidth) + (emphasis ? 2 : 0);

  const styles = [...lineStyles(colour, width, dash, emphasis)];
  if (zoom >= LABEL_MIN_ZOOM && feature.get('ref')) {
    styles.push(lineLabel(feature.get('ref'), colour));
  }
  return styles;
}

/**
 * The layer, without any source yet: the file is only opened once the map is zoomed in far enough to need it (see
 * ensureTransportSource).
 */
export function createTransportTilesLayer() {
  const state = { hoveredId: null, selectedId: null };
  const layer = new ol.layer.VectorTile({
    visible: false,
    minZoom: TRANSPORT_MIN_ZOOM,
    declutter: true,
    style: (feature, resolution) => transportStyle(feature, resolution, state),
  });
  layer.set('transportState', state);
  return layer;
}

export function ensureTransportSource(layer, url = transportTilesUrl()) {
  if (!layer.getSource()) {
    layer.setSource(new PMTilesVectorSource({ url, attributions: ATTRIBUTIONS, tileSize: 256 }));
  }
}

/** Highlights the line under the pointer and the clicked one. Only the given ids change. */
export function setTransportHighlight(layer, changes) {
  const state = layer.get('transportState');
  const next = { ...state, ...changes };
  if (next.hoveredId === state.hoveredId && next.selectedId === state.selectedId) {
    return;
  }
  Object.assign(state, next);
  layer.changed();
}

/**
 * What a click on a feature of the tiles shows: its kind, its properties and its position in degrees: the stop itself,
 * or the place that was clicked on a line.
 */
export function describeTransportFeature(feature, coordinate) {
  const properties = feature.getProperties();
  const kind = properties.layer === 'stops' ? 'stop' : 'line';
  const flat = kind === 'stop' ? feature.getFlatCoordinates?.() : null;
  const position = flat?.length === 2 && flat.every(Number.isFinite) ? flat : coordinate;
  const [lon, lat] = ol.proj.toLonLat(position);
  return { ...properties, kind, id: feature.getId(), lon, lat };
}
