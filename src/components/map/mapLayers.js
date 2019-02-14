import config from '@/js/config.ts';
import ol from '@/js/libs/ol.js';

function createSwisstopoLayer(title, layer, format = 'jpeg', time = 'current') {
  return new ol.layer.Tile({
    title: title,
    maxZoom: 19,
    type: 'base',
    visible: false,
    source: new ol.source.XYZ({
      attributions: [
        '<a target="_blank" href="http://www.swisstopo.admin.ch">swisstopo</a>'
      ],
      urls: ['10', '11', '12', '13', '14'].map(i => {
        return `https://wmts${i}.geo.admin.ch/1.0.0/${layer}/default/${time}/3857/{z}/{x}/{y}.${format}`;
      }),
      maxZoom: 17
    })
  });
}

function createIgnSource(title, layer, format = 'jpeg') {
  const resolutions = [];
  const matrixIds = [];
  const proj3857 = ol.proj.get('EPSG:3857');
  const maxResolution = ol.extent.getWidth(proj3857.getExtent()) / 256;

  for (let i = 0; i < 18; i++) {
    matrixIds[i] = i.toString();
    resolutions[i] = maxResolution / Math.pow(2, i);
  }

  const tileGrid = new ol.tilegrid.WMTS({
    origin: [-20037508, 20037508],
    resolutions: resolutions,
    matrixIds: matrixIds
  });

  let source = new ol.source.WMTS({
    url: '//wxs.ign.fr/' + config.ignApiKey + '/wmts',
    layer: layer,
    matrixSet: 'PM',
    format: `image/${format}`,
    projection: 'EPSG:3857',
    tileGrid: tileGrid,
    style: 'normal',
    attributions: [
      '<a href="http://www.geoportail.fr/" target="_blank">' +
        '<img src="//api.ign.fr/geoportail/api/js/latest/' +
        'theme/geoportal/img/logo_gp.gif"></a>'
    ]
  });

  return new ol.layer.Tile({
    title: title,
    type: 'base',
    maxZoom: 19,
    visible: false,
    source: source
  });
}

let esri = new ol.layer.Tile({
  title: 'Esri',
  maxZoom: 19,
  type: 'base',
  visible: true,
  source: new ol.source.XYZ({
    url:
      'https://server.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/' +
      'WMTS?layer=World_Topo_Map&style=default&tilematrixset=GoogleMapsCompatible&' +
      'Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&' +
      'TileMatrix={z}&TileCol={x}&TileRow={y}',
    attributions: [
      '<a href="https://www.arcgis.com/home/item.html?id=30e5fe3149c34df1ba922e6f5bbf808f"' +
        ' target="_blank">Esri</a>'
    ]
  })
});

/*
var openStreetMap = new ol.layer.Tile({
    title: 'OpenStreetMap',
    source: new OSM(),
    visible: false,
}) */

let bingMap = new ol.layer.Tile({
  title: 'Bing',
  maxZoom: 19,
  source: new ol.source.BingMaps({
    key: config.bingApiKey,
    imagerySet: 'AerialWithLabels'
  }),
  visible: false
});

let openTopoMap = new ol.layer.Tile({
  title: 'OpenTopoMap',
  type: 'base',
  maxZoom: 14,
  visible: false,
  source: new ol.source.XYZ({
    url: '//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attributions:
      '© <a href="//openstreetmap.org/copyright">OpenStreetMap</a> | ' +
      '© <a href="//opentopomap.org" target="_blank">OpenTopoMap</a>'
  })
});

let ign_maps = createIgnSource('IGN maps', 'GEOGRAPHICALGRIDSYSTEMS.MAPS');
let ign_ortho = createIgnSource('IGN otho', 'ORTHOIMAGERY.ORTHOPHOTOS');
let swissTopo = createSwisstopoLayer('SwissTopo', 'ch.swisstopo.pixelkarte-farbe');

let ign_slopes = createIgnSource('IGN', 'GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN', 'png');
let swiss_slopes = createSwisstopoLayer('SwissTopo', 'ch.swisstopo.hangneigung-ueber_30', 'png', '20160101');

ign_slopes.setOpacity(0.4);
swiss_slopes.setOpacity(0.4);

export const cartoLayers = [esri, /* openStreetMap, */ openTopoMap, bingMap, ign_maps, ign_ortho, swissTopo];
export const dataLayers = [ign_slopes, swiss_slopes];
export const swissTopoLayers = [swissTopo, swiss_slopes];
