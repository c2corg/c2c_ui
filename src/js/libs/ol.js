import 'elm-pep';
import { Feature, Map, Overlay, View } from 'ol';
import Geolocation from 'ol/Geolocation';
import { Attribution, Control, FullScreen, ScaleLine, Zoom } from 'ol/control';
import { format } from 'ol/coordinate';
import { buffer, containsXY, createEmpty, extend, getWidth, intersects } from 'ol/extent';
import GPX from 'ol/format/GPX';
import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import { LineString, MultiPolygon, Point, Polygon } from 'ol/geom';
import { fromExtent } from 'ol/geom/Polygon';
import { DragAndDrop, Draw, Modify, Snap } from 'ol/interaction';
import GroupLayer from 'ol/layer/Group';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { get as getProjection, toLonLat, transformExtent, transform as transformProjection } from 'ol/proj';
import BingMaps from 'ol/source/BingMaps';
import ImageStatic from 'ol/source/ImageStatic';
import VectorSource from 'ol/source/Vector';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import { Circle, Fill, Icon, Stroke, Style, Text } from 'ol/style';
import WMTSTileGrid from 'ol/tilegrid/WMTS';

// build our own ol module
export default {
  Map,
  View,
  Feature,
  Overlay,
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
    MultiPolygon,
    Point,
    Polygon,
    polygonFromExtent: fromExtent,
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
    Group: GroupLayer,
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
