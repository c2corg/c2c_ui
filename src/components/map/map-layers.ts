// The layers of the maps, as data: the 2D and 3D views and the Yeti portal build their layers from these entries
// (map-layers-ol.ts for OpenLayers, rasterSource() for MapLibre). Web Mercator tiles only, given by URL templates:
// {z}/{x}/{y} for XYZ and WMTS, {bbox-epsg-3857} for WMS.
import type { RasterSourceSpecification } from 'maplibre-gl';

import config from '@/js/config';
import { extentFromLonLat } from '@/js/geo/projection';

// the kinds of base layer: what a document map keeps from a document to the next one, rather than a layer, which may not
// cover the next document (a national map, a national orthophoto)
export const LAYER_CATEGORIES = ['topo', 'national', 'ortho', 'transport'] as const;
export type LayerCategory = (typeof LAYER_CATEGORIES)[number];

export type MapLayer = {
  // translated (Map layer context), also the image of the layer button, in src/assets/img/layers
  title: string;
  image?: string;
  // the flag shown on the button
  country?: string;
  // the kind of a base layer
  category?: LayerCategory;
  tiles: string[];
  // 128: tiles of the next zoom shown at half their size, for a sharper text (swisstopo maps)
  tileSize?: 128 | 256;
  minzoom?: number;
  maxzoom: number;
  // [west, south, east, north]: no tile request outside
  bounds?: [number, number, number, number];
  attribution: string;
  opacity?: number;
  // allowed in the 3D view by the licence and service terms of the layer (assessment of 2026-11-10)
  in3d?: boolean;
  // other tiles of the same map in 3D: the view reads the tiles of the small zooms away from the camera, where the
  // service of the 2D layer may show other maps
  tiles3d?: Pick<MapLayer, 'tiles' | 'minzoom' | 'maxzoom'>;
};

// the IGN France orthophotos are read through this protocol, which drops their white outside France (map-3d-layers.ts)
export const NO_BLANK = 'c2c-noblank';

export const SWISS_BOUNDS: [number, number, number, number] = [5.96, 45.82, 10.49, 47.81];
// in EPSG:3857
export const swissExtent = extentFromLonLat(SWISS_BOUNDS);

const link = (href: string, text: string) => `<a href="${href}" target="_blank" rel="noreferrer noopener">${text}</a>`;

// the SCAN maps (GEOGRAPHICALGRIDSYSTEMS.MAPS and its layers) are served under a key only
const ignFr = (layer: string, format = 'jpeg') =>
  (layer.startsWith('GEOGRAPHICALGRIDSYSTEMS.MAPS')
    ? 'https://data.geopf.fr/private/wmts?apikey=ign_scan_ws&'
    : 'https://data.geopf.fr/wmts?') +
  `SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=normal&TILEMATRIXSET=PM` +
  `&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/${format}`;
const IGN_FR = `© ${link('//www.geoportail.fr/', 'Geoportail')}`;

const swisstopo = (layer: string, format = 'jpeg') =>
  ['10', '11', '12', '13', '14'].map(
    (i) => `https://wmts${i}.geo.admin.ch/1.0.0/${layer}/default/current/3857/{z}/{x}/{y}.${format}`
  );
const SWISSTOPO = `© ${link('//www.swisstopo.admin.ch', 'Swisstopo')}`;

const ignEs = (path: string, layer: string) =>
  `https://www.ign.es/wmts/${path}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default` +
  '&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg';
const IGN_ES = `CC BY 4.0 ${link('https://www.scne.es', 'www.scne.es')}`;

// JPEG: the same map as in PNG, 5 times lighter (26 KB a tile, not 136 KB), also downloaded offline (offline-assets.ts)
const icgc = (layer: string) =>
  'https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wms/service?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap' +
  `&FORMAT=image/jpeg&LAYERS=${layer}&STYLES=&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`;
const ICGC = `CC BY 4.0 ${link('http://www.icgc.cat', 'ICGC')}`;

// maps1-4.wien.gv.at no longer resolve: mapsneu is the host of the current capabilities
const basemapAt = (layer: string, format: string) => [
  `https://mapsneu.wien.gv.at/basemap/${layer}/normal/google3857/{z}/{y}/{x}.${format}`,
];
const BASEMAP_AT = `© ${link('https://www.basemap.at', 'www.basemap.at')}`;

// the base layers of the 2D map, one of them shown: OpenTopoMap first, the default
export const baseLayers: MapLayer[] = [
  {
    // $gettext('OpenTopoMap', 'Map layer')
    title: 'OpenTopoMap',
    category: 'topo',
    image: 'opentopomap.jpg',
    tiles: ['a', 'b', 'c'].map((s) => `https://${s}.tile.opentopomap.org/{z}/{x}/{y}.png`),
    maxzoom: 17,
    attribution:
      `© ${link('//openstreetmap.org/copyright', 'OpenStreetMap')} | ` +
      `© ${link('//opentopomap.org', 'OpenTopoMap')}`,
  },
  {
    // $gettext('ESRI World Imagery', 'Map layer')
    title: 'ESRI World Imagery',
    category: 'ortho',
    image: 'esri.jpg',
    tiles: ['https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    maxzoom: 19,
    attribution: link('https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9', 'Esri'),
  },
  {
    // $gettext('Public transport', 'Map layer')
    title: 'Public transport',
    category: 'transport',
    image: 'publictransport.jpg',
    // MeMoMaps sends no CORS header, which the map needs: its tiles are read through our media host
    tiles: ['https://media.camptocamp.org/public-transport/tiles/{z}/{x}/{y}.png'],
    maxzoom: 18,
    attribution:
      `© ${link('//openstreetmap.org/copyright', 'OpenStreetMap')} | ` + `© ${link('//memomaps.de', 'ÖPNVKarte')}`,
    // in 3D too, until the public transport lines are drawn from vector tiles (a raster map is blurrier on the relief)
    in3d: true,
  },
  {
    // $gettext('IGN maps', 'Map layer')
    title: 'IGN maps',
    category: 'national',
    image: 'ign.jpg',
    country: 'fr',
    tiles: [ignFr('GEOGRAPHICALGRIDSYSTEMS.MAPS')],
    maxzoom: 17,
    attribution: IGN_FR,
    // the licence of the SCAN 25 says nothing of 3D, the same use as 2D (checked 2026-11-20)
    in3d: true,
    // the TOP 25 only, at every zoom (6 to 16, enlarged past it): the IGN maps show the SCAN 100 and others at the
    // small zooms, the 3D view would show them beyond the TOP 25 near the camera
    tiles3d: { tiles: [ignFr('GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR')], minzoom: 6, maxzoom: 16 },
  },
  {
    // $gettext('IGN ortho', 'Map layer')
    title: 'IGN ortho',
    category: 'ortho',
    image: 'ignortho.jpg',
    country: 'fr',
    tiles: [ignFr('ORTHOIMAGERY.ORTHOPHOTOS').replace('https://', `${NO_BLANK}://`)],
    maxzoom: 19,
    attribution: IGN_FR,
    in3d: true,
  },
  {
    // $gettext('SwissTopo', 'Map layer')
    title: 'SwissTopo',
    category: 'national',
    image: 'swisstopo.jpg',
    country: 'ch',
    tiles: swisstopo('ch.swisstopo.pixelkarte-farbe'),
    tileSize: 128,
    maxzoom: 17,
    bounds: SWISS_BOUNDS,
    attribution: SWISSTOPO,
  },
  {
    // $gettext('SwissTopo ortho', 'Map layer')
    title: 'SwissTopo ortho',
    category: 'ortho',
    image: 'swisstopoortho.jpg',
    country: 'ch',
    tiles: swisstopo('ch.swisstopo.swissimage'),
    maxzoom: 19,
    bounds: SWISS_BOUNDS,
    attribution: SWISSTOPO,
    in3d: true,
  },
  {
    // $gettext('IGN raster (es)', 'Map layer')
    title: 'IGN raster (es)',
    category: 'national',
    image: 'ignes.jpg',
    country: 'es',
    tiles: [ignEs('mapa-raster', 'MTN')],
    maxzoom: 20,
    attribution: IGN_ES,
  },
  {
    // $gettext('IGN ortho (es)', 'Map layer')
    title: 'IGN ortho (es)',
    category: 'ortho',
    image: 'ignesortho.jpg',
    country: 'es',
    tiles: [ignEs('pnoa-ma', 'OI.OrthoimageCoverage')],
    maxzoom: 20,
    attribution: IGN_ES,
    in3d: true,
  },
  {
    // $gettext('ICGC raster (ca)', 'Map layer')
    title: 'ICGC raster (ca)',
    category: 'national',
    image: 'icgc.jpg',
    country: 'catalonia',
    tiles: [icgc('topo')],
    maxzoom: 20,
    attribution: ICGC,
  },
  {
    // $gettext('ICGC ortho (ca)', 'Map layer')
    title: 'ICGC ortho (ca)',
    category: 'ortho',
    image: 'icgcortho.jpg',
    country: 'catalonia',
    tiles: [icgc('orto')],
    maxzoom: 20,
    attribution: ICGC,
  },
  {
    // $gettext('Basemap (at)', 'Map layer')
    title: 'Basemap (at)',
    category: 'national',
    image: 'at.jpg',
    country: 'at',
    tiles: basemapAt('bmapgrau', 'png'),
    maxzoom: 19,
    attribution: BASEMAP_AT,
  },
  {
    // $gettext('Basemap ortho (at)', 'Map layer')
    title: 'Basemap ortho (at)',
    category: 'ortho',
    image: 'atortho.jpg',
    country: 'at',
    tiles: basemapAt('bmaporthofoto30cm', 'jpeg'),
    maxzoom: 19,
    attribution: BASEMAP_AT,
  },
  {
    // $gettext('Ordnance Survey (uk)', 'Map layer')
    title: 'Ordnance Survey (uk)',
    category: 'national',
    image: 'uk.jpg',
    country: 'gb',
    // available backgrounds are Outdoor, Light, Road
    tiles: ['https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/{z}/{x}/{y}.png?key=' + config.ordnanceSurveyApiKey],
    minzoom: 7,
    maxzoom: 16,
    attribution: `© ${link('//www.ordnancesurvey.co.uk/', 'Ordnance Survey')}`,
  },
];

type Box = [number, number, number, number];

// where the national maps and orthophotos of a country have tiles, roughly: [west, south, east, north] boxes, several for
// the islands and the overseas departments. The smaller countries first: a point in Switzerland is also in the French box
export const COUNTRY_COVERAGE: Record<string, Box[]> = {
  ch: [SWISS_BOUNDS],
  catalonia: [[0.15, 40.5, 3.35, 42.9]],
  at: [[9.5, 46.37, 17.17, 49.02]],
  fr: [
    // metropolitan France down to the Pyrenees, Corsica: not the north of Spain, whose orthophoto is that of Spain
    [-5.2, 42.3, 8.3, 51.1],
    [8.5, 41.3, 9.6, 43.1],
    [-61.9, 14.35, -60.8, 16.55], // Guadeloupe, Martinique
    [-54.6, 2.1, -51.6, 5.8], // French Guiana
    [55.2, -21.4, 55.9, -20.85], // Réunion
    [44.9, -13.1, 45.35, -12.6], // Mayotte
    [-56.5, 46.7, -56.1, 47.2], // Saint-Pierre-et-Miquelon
  ],
  es: [
    [-9.4, 35.2, 4.4, 43.8], // the mainland, the Balearic Islands, Ceuta and Melilla
    [-18.2, 27.6, -13.4, 29.5], // the Canary Islands
  ],
  gb: [[-8.7, 49.85, 1.8, 60.9]],
};

// in degrees: a national layer is still offered near its country, only far away is it said not to apply
const COVERAGE_MARGIN = 0.5;

const touches = (a: Box, b: Box) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
const grown = ([west, south, east, north]: Box, margin: number): Box => [
  west - margin,
  south - margin,
  east + margin,
  north + margin,
];

// whether a layer applies to a place, a view [west, south, east, north] or a point [lon, lat]: the layers of the whole
// world always, a national one in its country and near it
export function layerCovers(layer: Pick<MapLayer, 'country'>, place: Box | [number, number]): boolean {
  if (!layer.country) return true;
  const boxes = COUNTRY_COVERAGE[layer.country];
  if (!boxes) return true;
  const box: Box = place.length === 2 ? [place[0], place[1], place[0], place[1]] : place;
  return boxes.some((coverage) => touches(grown(coverage, COVERAGE_MARGIN), box));
}

// the countries of a point, by their boxes without margin, the smaller ones first
export function countriesAt(lon: number, lat: number): string[] {
  return Object.keys(COUNTRY_COVERAGE).filter((country) =>
    COUNTRY_COVERAGE[country].some((coverage) => touches(coverage, [lon, lat, lon, lat]))
  );
}

// the countries of the national maps and orthophotos, by the c2c areas of the countries (Liechtenstein is on the swisstopo
// maps)
const COUNTRY_AREAS: Record<number, string> = {
  14274: 'fr',
  14067: 'ch',
  14381: 'ch',
  14267: 'es',
  14257: 'at',
  14081: 'gb',
};
// Catalonia is no c2c area: its four provinces (admin limits) give its ICGC layers, over the IGN Spain ones
const REGION_AREAS: Record<number, string> = {
  279930: 'catalonia', // Barcelona
  279939: 'catalonia', // Girona
  279949: 'catalonia', // Lleida
  279963: 'catalonia', // Tarragona
};

// the country of a document by its areas: a region with its own layers first, whatever the order of the areas
export function countryOfAreas(areaIds: number[]): string | undefined {
  for (const areas of [REGION_AREAS, COUNTRY_AREAS]) {
    const id = areaIds.find((areaId) => areas[areaId]);
    if (id !== undefined) return areas[id];
  }
  return undefined;
}

// all the countries of a document by its areas (a document on a border is in two), a region with its own layers instead
// of its country (Catalonia, not Spain): the national maps it takes offline (src/pwa/offline-assets.ts)
export function countriesOfAreas(areaIds: number[]): Set<string> {
  const regions = areaIds.filter((id) => REGION_AREAS[id]).map((id) => REGION_AREAS[id]);
  const countries = areaIds.filter((id) => COUNTRY_AREAS[id]).map((id) => COUNTRY_AREAS[id]);
  // Spain only outside Catalonia
  return new Set([...regions, ...countries.filter((country) => !(country === 'es' && regions.includes('catalonia')))]);
}

// the base layer of a category in a country: its national map or orthophoto, else OpenTopoMap or the world orthophoto
export function baseLayerOf(category: LayerCategory, country?: string): string {
  const layers = baseLayers.filter((layer) => layer.category === category);
  const national = country ? layers.find((layer) => layer.country === country) : undefined;
  return (national ?? layers.find((layer) => !layer.country) ?? baseLayers[0]).title;
}

// the category of a layer, in 2D or in 3D
export function categoryOf(title: string): LayerCategory | undefined {
  return [...baseLayers, worldLayer].find((layer) => layer.title === title)?.category;
}

// the base layer whose tiles each topo saved offline downloads (src/pwa/offline-assets.ts): without a network, the 2D map
// shows it under a layer without downloaded tiles, or instead of it when opened offline (C2cMap)
export const OFFLINE_BASE_LAYER = baseLayers[0].title;

// the base layers of the 3D view: the orthophotos and the maps allowed there, over the world one
export const orthoLayers = baseLayers.filter((layer) => layer.in3d);
// the national orthophotos: the layer of a country in 3D when the 2D one is not shown there
export const nationalOrthoLayers = orthoLayers.filter((layer) => layer.country && / ortho\b/.test(layer.title));

// covers the whole world in 3D, also under the national orthophotos, past their borders
export const worldLayer: MapLayer = {
  // $gettext('Sentinel-2', 'Map layer')
  title: 'Sentinel-2',
  category: 'ortho',
  image: 's2cloudless.jpg',
  // 2016 mosaic: CC BY 4.0 (the later years are non commercial)
  tiles: ['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg'],
  maxzoom: 14,
  attribution:
    `${link('https://s2maps.eu', 'Sentinel-2 cloudless 2016 by EOX')}` +
    ' (Contains modified Copernicus Sentinel data 2016)',
  in3d: true,
};

export const slopeLayers: MapLayer[] = [
  {
    // $gettext('IGN Slopes', 'Map slopes layer')
    title: 'IGN Slopes',
    image: 'ignslopes.jpg',
    country: 'fr',
    tiles: [ignFr('GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN', 'png')],
    maxzoom: 17,
    attribution: IGN_FR,
    opacity: 0.4,
    in3d: true,
  },
  {
    // $gettext('SwissTopo Slopes', 'Map slopes layer')
    title: 'SwissTopo Slopes',
    image: 'swisstoposlopes.jpg',
    country: 'ch',
    tiles: swisstopo('ch.swisstopo.hangneigung-ueber_30', 'png'),
    maxzoom: 17,
    bounds: SWISS_BOUNDS,
    attribution: SWISSTOPO,
    opacity: 0.4,
    in3d: true,
  },
];

// the protection areas of Switzerland; the biodiv-sports ones are features loaded by the map
export const swissProtectionLayers: MapLayer[] = [
  {
    title: 'Swiss tranquility zones',
    image: 'fauna.jpg',
    country: 'ch',
    tiles: swisstopo('ch.bafu.wrz-wildruhezonen_portal', 'png'),
    maxzoom: 17,
    bounds: SWISS_BOUNDS,
    attribution: SWISSTOPO,
    opacity: 0.7,
    in3d: true,
  },
  {
    title: 'Swiss fauna protection zones',
    image: 'fauna.jpg',
    country: 'ch',
    tiles: swisstopo('ch.bafu.wrz-jagdbanngebiete_select', 'png'),
    maxzoom: 17,
    bounds: SWISS_BOUNDS,
    attribution: SWISSTOPO,
    opacity: 0.7,
    in3d: true,
  },
];

/** The MapLibre source of a layer */
export const rasterSource = ({ tiles, tileSize, minzoom, maxzoom, bounds, attribution }: MapLayer) =>
  ({
    type: 'raster',
    tiles,
    tileSize: tileSize ?? 256,
    maxzoom,
    attribution,
    ...(minzoom === undefined ? {} : { minzoom }),
    ...(bounds ? { bounds } : {}),
  }) as RasterSourceSpecification;
