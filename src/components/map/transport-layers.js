/*
 * The public transport layers of the maps: lines, and stops.
 *
 * The data is requested by tiles of a fixed grid (and not for the displayed
 * extent): zooming in does not request anything, moving the map requests
 * only the new tiles, and the requests of a tile are always the same, so
 * the browser caches them.
 */
import { getDocumentPointStyle } from './map-utils';

import transportService from '@/js/apis/transport-service';
import ol from '@/js/libs/ol';

// lines are requested from this zoom, by tiles of this zoom
export const LINES_MIN_ZOOM = 10;
// stops linked to a waypoint
export const STOPS_MIN_ZOOM = 12;
// all the stops
export const ALL_STOPS_MIN_ZOOM = 14;
// to hit the thin lines
export const LINES_HIT_TOLERANCE = 6;
// the names of the lines are written on them from this resolution
const LINE_NAME_MAX_RESOLUTION = 10;

const geoJSON = new ol.format.GeoJSON();

/** The tiles of the zoom `zoom`, whatever the zoom of the view */
const tiles = (zoom) => ol.loadingstrategy.tile(ol.tilegrid.createXYZ({ maxZoom: zoom }));

// lines

const lineStyles = {};

function lineStyle(feature, resolution) {
  const hover = feature.get('hover');
  const selected = feature.get('selected');
  // a white line is not visible on its white casing
  const color = '#' + (!feature.get('color') || feature.get('color') === 'FFFFFF' ? '808080' : feature.get('color'));
  const name = resolution < LINE_NAME_MAX_RESOLUTION ? feature.get('short_name') : null;
  const key = [color, hover, selected, name].join('|');

  if (!lineStyles[key]) {
    const emphasis = hover || selected;
    lineStyles[key] = [
      new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#ffffff',
          width: emphasis ? 10 : 6,
          lineCap: 'round',
          lineJoin: 'round',
        }),
        zIndex: emphasis ? 2 : 0,
      }),
      new ol.style.Style({
        stroke: new ol.style.Stroke({ color, width: emphasis ? 6 : 3, lineCap: 'round', lineJoin: 'round' }),
        text: name
          ? new ol.style.Text({
              text: name,
              placement: 'line',
              repeat: 400,
              overflow: true,
              font: 'bold 12px sans-serif',
              fill: new ol.style.Fill({ color: '#000000' }),
              stroke: new ol.style.Stroke({ color: '#ffffff', width: 3 }),
            })
          : undefined,
        zIndex: emphasis ? 3 : 1,
      }),
    ];
  }
  return lineStyles[key];
}

// stops

// stops of a waypoint: the bus marker of the nearby stops
let linkedStopStyles;
// the other stops: small
let otherStopStyles;

function stopStyles(stop) {
  linkedStopStyles ??= {
    normal: getDocumentPointStyle({ type: 's' }, '', false),
    highlighted: getDocumentPointStyle({ type: 's' }, '', true),
  };
  otherStopStyles ??= {
    normal: new ol.style.Style({
      image: new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({ color: '#ffffff' }),
        stroke: new ol.style.Stroke({ color: '#4a6fa5', width: 2 }),
      }),
      zIndex: 1,
    }),
    highlighted: new ol.style.Style({
      image: new ol.style.Circle({
        radius: 8,
        fill: new ol.style.Fill({ color: '#dbe7f5' }),
        stroke: new ol.style.Stroke({ color: '#4a6fa5', width: 3 }),
      }),
      zIndex: 101,
    }),
  };
  // a Navitia stop is always the one of a waypoint
  return stop.kind !== 'gtfs' || stop.linked ? linkedStopStyles : otherStopStyles;
}

const hiddenStyle = new ol.style.Style();

/** Hides the stop (nothing is drawn) when the map already draws it */
function setStopVisible(feature, visible) {
  const styles = stopStyles(feature.get('stopData'));
  feature.set('normalStyle', visible ? styles.normal : hiddenStyle);
  feature.set('highlightedStyle', visible ? styles.highlighted : hiddenStyle);
  feature.setStyle(visible ? styles.normal : hiddenStyle);
}

function stopFeature(stop, isDrawnElsewhere) {
  const feature = new ol.Feature({
    geometry: new ol.geom.Point([stop.coordinates.x, stop.coordinates.y]),
    stopData: stop,
  });
  feature.setId(stop.kind === 'gtfs' ? `gtfs_${stop.id}` : `navitia_${stop.navitia_id}`);
  setStopVisible(feature, !isDrawnElsewhere(stop.coordinates));
  return feature;
}

/**
 * Creates the layers.
 *
 * @param {(coordinates: { x: number; y: number }) => boolean} isDrawnElsewhere Is a stop already drawn by the map
 *   (stops near the access of a route)?
 */
export function createTransportLayers(isDrawnElsewhere = () => false) {
  /** A loader of a source: a failing tile is requested again the next time */
  const loader = (source, request) =>
    function (extent) {
      return request(extent).catch((error) => {
        source.removeLoadedExtent(extent);
        throw error;
      });
    };

  const linesSource = new ol.source.Vector({ strategy: tiles(LINES_MIN_ZOOM) });
  linesSource.setLoader(
    loader(linesSource, (extent) =>
      transportService.getLinesInExtent(extent).then(({ data }) => geoJSON.readFeatures(data))
    )
  );

  // the stops of a waypoint, and the Navitia stops that are not matched with a GTFS stop
  const stopsSource = new ol.source.Vector({ strategy: tiles(STOPS_MIN_ZOOM) });
  stopsSource.setLoader(
    loader(stopsSource, (extent) =>
      transportService
        .getStopsInExtent(extent)
        .then(({ data }) => data.documents.map((stop) => stopFeature(stop, isDrawnElsewhere)))
    )
  );

  // the other stops, from a greater zoom
  const otherStopsSource = new ol.source.Vector({ strategy: tiles(STOPS_MIN_ZOOM) });
  otherStopsSource.setLoader(
    loader(otherStopsSource, (extent) =>
      transportService
        .getStopsInExtent(extent, true)
        .then(({ data }) =>
          data.documents
            .filter((stop) => stop.kind === 'gtfs' && !stop.linked)
            .map((stop) => stopFeature(stop, isDrawnElsewhere))
        )
    )
  );

  const layers = {
    // under the other layers of the map
    lines: new ol.layer.Vector({
      source: linesSource,
      style: lineStyle,
      minZoom: LINES_MIN_ZOOM - 0.01,
    }),
    otherStops: new ol.layer.Vector({ source: otherStopsSource, minZoom: ALL_STOPS_MIN_ZOOM - 0.01 }),
    stops: new ol.layer.Vector({ source: stopsSource, minZoom: STOPS_MIN_ZOOM - 0.01 }),
  };
  return layers;
}

/** Draws again the stops: the ones the map already draws (the documents change) are hidden. */
export function updateHiddenStops(layers, isDrawnElsewhere) {
  for (const layer of [layers.stops, layers.otherStops]) {
    layer.getSource().forEachFeature((feature) => {
      setStopVisible(feature, !isDrawnElsewhere(feature.get('stopData').coordinates));
    });
  }
}
