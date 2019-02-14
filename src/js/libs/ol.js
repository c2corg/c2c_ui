import { Map, View, Feature } from 'ol';

import { Control, FullScreen, ScaleLine, Zoom, Attribution } from 'ol/control';

import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';

import VectorSource from 'ol/source/Vector';
import BingMaps from 'ol/source/BingMaps';
import XYZ from 'ol/source/XYZ';
import WMTS from 'ol/source/WMTS';

import WMTSTileGrid from 'ol/tilegrid/WMTS';

import Point from 'ol/geom/Point';

import { Icon, Style, Circle, Fill, Stroke, Text } from 'ol/style';

import Geolocation from 'ol/Geolocation';

import GeoJSON from 'ol/format/GeoJSON';
import GPX from 'ol/format/GPX';
import KML from 'ol/format/KML';
import { get as getProjection, transform as transformProjection, transformExtent, toLonLat } from 'ol/proj';
import { getWidth, containsXY, createEmpty, extend, buffer } from 'ol/extent';

import { Draw, Modify, Snap, DragAndDrop } from 'ol/interaction';

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
    Attribution
  },

  extent: {
    buffer,
    getWidth,
    containsXY,
    createEmpty,
    extend
  },

  format: {
    GeoJSON,
    GPX,
    KML
  },

  geom: {
    Point
  },

  interaction: {
    Draw,
    Modify,
    Snap,
    DragAndDrop
  },

  layer: {
    Vector: VectorLayer,
    Tile: TileLayer
  },

  proj: {
    get: getProjection,
    transform: transformProjection,
    transformExtent,
    toLonLat
  },

  source: {
    Vector: VectorSource,
    BingMaps,
    XYZ,
    WMTS
  },

  style: {
    Icon,
    Style,
    Circle,
    Fill,
    Stroke,
    Text
  },

  tilegrid: {
    WMTS: WMTSTileGrid
  }
};
