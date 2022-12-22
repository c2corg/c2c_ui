import config from '@/js/config';
import ol from '@/js/libs/ol';

function createSwisstopoLayer(title, image, layer, format = 'jpeg', time = 'current') {
  return new ol.layer.Tile({
    title,
    image,
    country: 'ch',
    type: 'base',
    visible: false,
    source: new ol.source.XYZ({
      attributions: ['© <a target="_blank" rel="noreferrer noopener" href="//www.swisstopo.admin.ch">Swisstopo</a>'],
      urls: ['10', '11', '12', '13', '14'].map((i) => {
        return `https://wmts${i}.geo.admin.ch/1.0.0/${layer}/default/${time}/3857/{z}/{x}/{y}.${format}`;
      }),
      maxZoom: 17,
    }),
  });
}

function createIgnFrSource(title, image, layer, format = 'jpeg') {
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
    attributions: ['© <a href="//www.geoportail.fr/" target="_blank" rel="noreferrer noopener">Geoportail</a>'],
  });

  return new ol.layer.Tile({
    title,
    image,
    country: 'fr',
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
function createIgnEsSource(title, image, source) {
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
    image,
    country: 'es',
    type: 'base',
    visible: false,
    source: new ol.source.WMTS({
      url,
      layer,
      matrixSet: 'EPSG:3857',
      format: 'image/jpeg',
      projection: 'EPSG:3857',
      tileGrid,
      attributions: [
        'CC BY 4.0 <a href="https://www.scne.es" target="_blank" rel="noreferrer noopener">www.scne.es</a>',
      ],
    }),
  });
}

function createIcgcSource(title, image, source) {
  return new ol.layer.Tile({
    title,
    image,
    country: 'catalonia',
    visible: false,
    source: new ol.source.TileWMS({
      projection: 'EPSG:3857',
      url: 'https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wms/service?',
      params: {
        LAYERS: source,
      },
      attributions: ['CC BY 4.0 <a href="http://www.icgc.cat" target="_blank" rel="noreferrer noopener">ICGC</a>'],
    }),
  });
}

function createBaseMapDotAtSource(title, image, source) {
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
    image,
    country: 'at',
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

function createOrdnanceSurveySource() {
  // available backgrounds are Outdoor, Light, Road
  return new ol.layer.Tile({
    title: 'UK',
    image: 'uk.jpg',
    country: 'gb',
    type: 'base',
    visible: false,
    source: new ol.source.XYZ({
      attributions: [
        '© <a target="_blank" rel="noreferrer noopener" href="//www.ordnancesurvey.co.uk/">Ordnance Survey</a>',
      ],
      url: 'https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/{z}/{x}/{y}.png?key=' + config.ordnanceSurveyApiKey,
      minZoom: 7,
      maxZoom: 16,
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
          ' target="_blank" rel="noreferrer noopener">Esri</a>'
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
    image: 'opentopomap.jpg',
    type: 'base',
    visible: true,
    source: new ol.source.XYZ({
      url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attributions:
        '© <a href="//openstreetmap.org/copyright" target)"_blank" rel="noreferrer noopener">OpenStreetMap</a> | ' +
        '© <a href="//opentopomap.org" target="_blank" rel="noreferrer noopener">OpenTopoMap</a>',
      maxZoom: 17,
    }),
  });

  // $gettext('ESRI World Imagery', 'Map layer')
  const esriImagery = new ol.layer.Tile({
    title: 'Esri World Imagery',
    image: 'esri.jpg',
    type: 'base',
    visible: false,
    source: new ol.source.XYZ({
      url: 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attributions: [
        '<a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9"' +
          ' target="_blank" rel="noreferrer noopener">Esri</a>',
      ],
      maxZoom: 19,
    }),
  });

  // $gettext('IGN maps', 'Map layer')
  const ignFrMaps = createIgnFrSource('IGN maps', 'ign.jpg', 'GEOGRAPHICALGRIDSYSTEMS.MAPS');
  // $gettext('IGN ortho', 'Map layer')
  const ignFrOrtho = createIgnFrSource('IGN ortho', 'ignortho.jpg', 'ORTHOIMAGERY.ORTHOPHOTOS');
  // $gettext('SwissTopo', 'Map layer')
  const swissTopo = createSwisstopoLayer(
    'SwissTopo',
    'swisstopo.jpg',
    'ch.swisstopo.pixelkarte-farbe',
    'jpeg',
    'current'
  );
  // $gettext('SwissTopo ortho', 'Map layer')
  const swissTopoOrtho = createSwisstopoLayer(
    'SwissTopo ortho',
    'swisstopoortho.jpg',
    'ch.swisstopo.swissimage',
    'jpeg',
    'current'
  );
  // $gettext('IGN raster (es)', 'Map layer')
  const ignEsMaps = createIgnEsSource('IGN raster (es)', 'ignes.jpg', 'raster');
  // $gettext('IGN ortho (es)', 'Map layer')
  const ignEsOrtho = createIgnEsSource('IGN ortho (es)', 'ignesortho.jpg', 'ortho');
  // $gettext('ICGC raster (ca)', 'Map layer')
  const icgcMaps = createIcgcSource('ICGC maps (ca)', 'icgc.jpg', 'topo');
  // $gettext('ICGC ortho (ca)', 'Map layer')
  const icgcOrtho = createIcgcSource('ICGC ortho (ca)', 'icgcortho.jpg', 'orto');
  // $gettext('Basemap (at)', 'Map layer')
  const basemap = createBaseMapDotAtSource('Basemap (at)', 'at.jpg', 'raster');
  // $gettext('Basemap ortho (at)', 'Map layer')
  const basemapOrtho = createBaseMapDotAtSource('Basemap ortho (at)', 'atortho.jpg', 'ortho');
  // $gettext('Ordnance Survey (uk), 'Map layer')
  const ordnanceSurvey = createOrdnanceSurveySource();
  return [
    openTopoMap,
    /* esri, */
    esriImagery,
    /* bingMap, */
    ignFrMaps,
    ignFrOrtho,
    swissTopo,
    swissTopoOrtho,
    ignEsMaps,
    ignEsOrtho,
    icgcMaps,
    icgcOrtho,
    basemap,
    basemapOrtho,
    ordnanceSurvey,
  ];
};

export const dataLayers = function () {
  // $gettext('IGN Slopes', 'Map slopes layer')
  const ignSlopes = createIgnFrSource('IGN Slopes', 'ignslopes.jpg', 'GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN', 'png');
  ignSlopes.setOpacity(0.4);
  // $gettext('SwissTopo Slopes', 'Map slopes layer')
  const swissSlopes = createSwisstopoLayer(
    'SwissTopo Slopes',
    'swisstoposlopes.jpg',
    'ch.swisstopo.hangneigung-ueber_30',
    'png',
    'current'
  );
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
