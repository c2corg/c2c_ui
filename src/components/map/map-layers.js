import config from '@/js/config';
import ol from '@/js/libs/ol';

function createSwisstopoLayer(title, layer, format = 'jpeg', time = 'current') {
  return new ol.layer.Tile({
    title,
    type: 'base',
    visible: false,
    source: new ol.source.XYZ({
      attributions: ['© <a target="_blank" rel="noreferer noopener" href="//www.swisstopo.admin.ch">Swisstopo</a>'],
      urls: ['10', '11', '12', '13', '14'].map((i) => {
        return `https://wmts${i}.geo.admin.ch/1.0.0/${layer}/default/${time}/3857/{z}/{x}/{y}.${format}`;
      }),
      maxZoom: 17,
    }),
  });
}

function createIgnFrSource(title, layer, format = 'jpeg') {
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
    resolutions,
    matrixIds,
  });

  let url;
  switch (layer) {
    case 'GEOGRAPHICALGRIDSYSTEMS.MAPS':
      url = '//wxs.ign.fr/' + config.ignApiKey + '/geoportail/wmts';
      break;
    case 'GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN':
      url = '//wxs.ign.fr/altimetrie/geoportail/wmts';
      break;
    default:
      url = '//wxs.ign.fr/pratique/geoportail/wmts';
  }

  const source = new ol.source.WMTS({
    url,
    layer,
    matrixSet: 'PM',
    format: `image/${format}`,
    projection: 'EPSG:3857',
    tileGrid,
    style: 'normal',
    attributions: ['© <a href="//www.geoportail.fr/" target="_blank" rel="noreferer noopener">Geoportail</a>'],
  });

  return new ol.layer.Tile({
    title,
    type: 'base',
    visible: false,
    source,
  });
}

/**
 * Creates map layer for IGN spain.
 * Available maps useful for c2c are:
 * - raster
 * - base
 * - ortho
 *
 * See http://www.ign.es/web/ign/portal/ide-area-nodo-ide-ign
 */
function createIgnEsSource(title, source) {
  let url = 'http://www.ign.es/wmts/';
  let layer;
  switch (source) {
    case 'base':
      url += 'ign-base';
      layer = 'IGNBaseTodo';
      break;
    case 'ortho':
      url += 'pnoa-ma';
      layer = 'OI.OrthoimageCoverage';
      break;
    case 'raster':
    default:
      url += 'mapa-raster';
      layer = 'MTN';
      break;
  }

  const levels = 21;
  const proj3857 = ol.proj.get('EPSG:3857');
  const maxResolution = ol.extent.getWidth(proj3857.getExtent()) / 256;
  const resolutions = [];
  const matrixIds = [];
  for (let i = 0; i < levels; i++) {
    matrixIds[i] = i.toString();
    resolutions[i] = maxResolution / Math.pow(2, i);
  }

  const tileGrid = new ol.tilegrid.WMTS({
    extent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
    origin: [-20037508.34, 20037508.34],
    resolutions,
    matrixIds,
  });

  return new ol.layer.Tile({
    title,
    type: 'base',
    visible: false,
    source: new ol.source.WMTS({
      url,
      layer,
      matrixSet: 'EPSG:3857',
      format: 'image/jpeg',
      projection: 'EPSG:3857',
      tileGrid,
      attributions: ['CC BY 4.0 <a href="www.scne.es" target="_blank" rel="noreferrer noopener>www.scne.es</a>'],
    }),
  });
}

function createBaseMapDotAtSource(title, source) {
  let format;
  let layer;
  switch (source) {
    case 'ortho':
      format = 'jpeg';
      layer = 'bmaporthofoto30cm';
      break;
    case 'raster':
    default:
      format = 'png';
      layer = 'bmapgrau';
      break;
  }

  const levels = 20;
  const proj3857 = ol.proj.get('EPSG:3857');
  const maxResolution = ol.extent.getWidth(proj3857.getExtent()) / 256;
  const resolutions = [];
  const matrixIds = [];
  for (let i = 0; i < levels; i++) {
    matrixIds[i] = i.toString();
    resolutions[i] = maxResolution / Math.pow(2, i);
  }

  const tileGrid = new ol.tilegrid.WMTS({
    extent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
    origin: [-20037508.34, 20037508.34],
    resolutions,
    matrixIds,
  });

  return new ol.layer.Tile({
    title,
    type: 'base',
    visible: false,
    source: new ol.source.WMTS({
      name: 'basemap.at',
      urls: ['', '1', '2', '3', '4'].map(
        (i) =>
          `https://maps${i}.wien.gv.at/basemap/${layer}/normal/google3857/{TileMatrix}/{TileRow}/{TileCol}.${format}`
      ),
      requestEncoding: 'REST',
      layer: 'geolandbasemap',
      matrixSet: 'google3857',
      tileGrid,
      attributions: '© <a href="https://www.basemap.at" target="_blank" rel="norefferer noopener">www.basemap.at</a>',
    }),
  });
}

function createOrdnanceSurveySource(title) {
  // available backgrounds are Outdoor, Light, Road
  return new ol.layer.Tile({
    title,
    type: 'base',
    visible: false,
    source: new ol.source.XYZ({
      attributions: [
        '© <a target="_blank" rel="noreferer noopener" href="//www.ordnancesurvey.co.uk/">Ordnance Survey</a>',
      ],
      url: 'https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/{z}/{x}/{y}.png?key=' + config.ordnanceSurveyApiKey,
      minZoom: 7,
      maxZoom: 20,
    }),
  });
}

export const cartoLayers = function () {
  // $gettext('ESRI', 'Map layer')
  /* const esri = new ol.layer.Tile({
    title: 'Esri',
    type: 'base',
    visible: false,
    source: new ol.source.XYZ({
      url:
        'https://server.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/' +
        'WMTS?layer=World_Topo_Map&style=default&tilematrixset=GoogleMapsCompatible&' +
        'Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&' +
        'TileMatrix={z}&TileCol={x}&TileRow={y}',
      attributions: [
        '<a href="https://www.arcgis.com/home/item.html?id=30e5fe3149c34df1ba922e6f5bbf808f"' +
          ' target="_blank" rel="noreferer">Esri</a>'
      ],
      maxZoom: 19
    })
  }); */

  // $gettext('Bing', 'Map layer')
  /* const bingMap = new ol.layer.Tile({
    title: 'Bing',
    source: new ol.source.BingMaps({
      key: config.bingApiKey,
      imagerySet: 'AerialWithLabels'
    }),
    visible: false
  }); */

  // $gettext('OpenTopoMap', 'Map layer')
  const openTopoMap = new ol.layer.Tile({
    title: 'OpenTopoMap',
    type: 'base',
    visible: true,
    source: new ol.source.XYZ({
      url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attributions:
        '© <a href="//openstreetmap.org/copyright" target)"_blank" rel="noopener noreferer">OpenStreetMap</a> | ' +
        '© <a href="//opentopomap.org" target="_blank" rel="noopener noreferer">OpenTopoMap</a>',
      maxZoom: 17,
    }),
  });

  // $gettext('IGN maps', 'Map layer')
  const ignFrMaps = createIgnFrSource('IGN maps', 'GEOGRAPHICALGRIDSYSTEMS.MAPS');
  // $gettext('IGN ortho', 'Map layer')
  const ignFrOrtho = createIgnFrSource('IGN ortho', 'ORTHOIMAGERY.ORTHOPHOTOS');
  // $gettext('SwissTopo', 'Map layer')
  const swissTopo = createSwisstopoLayer('SwissTopo', 'ch.swisstopo.pixelkarte-farbe', 'jpeg', 'current');
  // $gettext('SwissTopo ortho', 'Map layer')
  const swissTopoOrtho = createSwisstopoLayer('SwissTopo ortho', 'ch.swisstopo.swissimage', 'jpeg', 'current');
  // $gettext('IGN raster (es)', 'Map layer')
  const ignEsMaps = createIgnEsSource('IGN raster (es)', 'raster');
  // $gettext('IGN ortho (es)', 'Map layer')
  const ignEsOrtho = createIgnEsSource('IGN ortho (es)', 'ortho');
  // $gettext('Basemap (at)', 'Map layer')
  const basemap = createBaseMapDotAtSource('Basemap (at)', 'raster');
  // $gettext('Basemap ortho (at)', 'Map layer')
  const basemapOrtho = createBaseMapDotAtSource('Basemap ortho (at)', 'ortho');
  // $gettext('Ordnance Survey (uk), 'Map layer')
  const ordnanceSurvey = createOrdnanceSurveySource('UK');
  return [
    openTopoMap,
    /* esri, */
    /* bingMap, */
    ignFrMaps,
    ignFrOrtho,
    swissTopo,
    swissTopoOrtho,
    ignEsMaps,
    ignEsOrtho,
    basemap,
    basemapOrtho,
    ordnanceSurvey,
  ];
};

export const dataLayers = function () {
  // $gettext('IGN', 'Map slopes layer')
  const ignSlopes = createIgnFrSource('IGN', 'GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN', 'png');
  ignSlopes.setOpacity(0.4);
  // $gettext('SwissTopo', 'Map slopes layer')
  const swissSlopes = createSwisstopoLayer('SwissTopo', 'ch.swisstopo.hangneigung-ueber_30', 'png', 'current');
  swissSlopes.setOpacity(0.4);

  return [ignSlopes, swissSlopes];
};

export const protectionAreasLayers = function () {
  const swissTranquilityZones = createSwisstopoLayer(
    'Swiss tranquility zones',
    'ch.bafu.wrz-wildruhezonen_portal',
    'png'
  );
  swissTranquilityZones.setOpacity(0.7);
  const swissFaunaProtectionZones = createSwisstopoLayer(
    'Swiss fauna protection zones',
    'ch.bafu.wrz-jagdbanngebiete_select',
    'png'
  );
  swissFaunaProtectionZones.setOpacity(0.7);

  return [swissTranquilityZones, swissFaunaProtectionZones];
};
