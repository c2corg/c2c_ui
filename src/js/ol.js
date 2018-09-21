import { Map, View, Feature } from 'ol';

import { defaults as defaultControls, Control, FullScreen, ScaleLine } from 'ol/control';

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
import { get as getProjection, transform as transformProjection, transformExtent} from 'ol/proj';
import { getWidth } from 'ol/extent';





//build our own ol module
export default {
    Map,
    View,
    Feature,
    Geolocation,

    control: {
        defaults : defaultControls,
        Control,
        FullScreen,
        ScaleLine,
    },

    extent: {
        getWidth,
    },

    format: {
        GeoJSON
    },

    geom: {
        Point,
    },

    layer: {
        Vector: VectorLayer,
        Tile: TileLayer,
    },

    proj: {
        get: getProjection,
        transform: transformProjection,
        transformExtent,
    },

    source: {
        Vector: VectorSource,
        BingMaps,
        XYZ,
        WMTS,
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
        WMTS: WMTSTileGrid,
    },
}
