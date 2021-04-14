import 'elm-pep';
import { Feature, Map, View } from 'ol';
import Geolocation from 'ol/Geolocation';
import { Attribution, Control, FullScreen, ScaleLine, Zoom } from 'ol/control';
import { format } from 'ol/coordinate';
import { buffer, containsXY, createEmpty, extend, getWidth, intersects } from 'ol/extent';
import GPX from 'ol/format/GPX';
import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import { LineString, Point, Polygon } from 'ol/geom';
import { DragAndDrop, Draw, Modify, Snap } from 'ol/interaction';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { get as getProjection, toLonLat, transformExtent, transform as transformProjection } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import BingMaps from 'ol/source/BingMaps';
import ImageStatic from 'ol/source/ImageStatic';
import VectorSource from 'ol/source/Vector';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import { Circle, Fill, Icon, Stroke, Style, Text } from 'ol/style';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import proj4 from 'proj4';

// To use other projections, one has to register the projection in OpenLayers.
// This can easily be done with [https://proj4js.org](proj4)
//
// By default OpenLayers does not know about the EPSG:21781 (Swiss) projection.
// So we create a projection instance for EPSG:21781 and pass it to
// register to make it available to the library for lookup by its
// code.
// See http://spatialreference.org/ref/epsg/21781/
proj4.defs(
  'EPSG:21781',
  '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 ' +
    '+x_0=600000 +y_0=200000 +ellps=bessel ' +
    '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs'
);
register(proj4);

// build our own ol module
export default {
  Map,
  View,
  Feature,
  Geolocation,

  control: {
    Control,
    FullScreen,
    ScaleLine,
    Zoom,
    Attribution,
  },

  coordinate: {
    format,
  },

  extent: {
    buffer,
    getWidth,
    containsXY,
    createEmpty,
    extend,
    intersects,
  },

  format: {
    GeoJSON,
    GPX,
    KML,
  },

  geom: {
    LineString,
    Point,
    Polygon,
  },

  interaction: {
    Draw,
    Modify,
    Snap,
    DragAndDrop,
  },

  layer: {
    Vector: VectorLayer,
    Tile: TileLayer,
    Image: ImageLayer,
  },

  proj: {
    get: getProjection,
    transform: transformProjection,
    transformExtent,
    toLonLat,
  },

  source: {
    Vector: VectorSource,
    BingMaps,
    XYZ,
    WMTS,
    ImageStatic,
  },

  style: {
    Icon,
    Style,
    Circle,
    Fill,
    Stroke,
    Text,
  },

  tilegrid: {
    WMTS: WMTSTileGrid,
  },
};
