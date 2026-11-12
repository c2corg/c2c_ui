// SPIKE: the layers of the 3D view, as MapLibre sources.
// Only layers whose licence and service terms allow 3D use (spike assessment of 2026-11-10).

export type Layer3d = {
  // also the image of the layer button, in src/assets/img/layers
  title: string;
  image: string;
  country?: string;
  tiles: string[];
  maxzoom: number;
  // [west, south, east, north]: no tile request outside
  bounds?: [number, number, number, number];
  attribution: string;
};

const ignFr = (layer: string, format = 'jpeg') =>
  'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
  `&LAYER=${layer}&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/${format}`;

const swisstopo = (layer: string, format = 'jpeg') =>
  ['10', '11', '12', '13', '14'].map(
    (i) => `https://wmts${i}.geo.admin.ch/1.0.0/${layer}/default/current/3857/{z}/{x}/{y}.${format}`
  );

const FRANCE_BOUNDS: [number, number, number, number] = [-5.5, 41.3, 9.7, 51.2];
const SWISS_BOUNDS: [number, number, number, number] = [5.96, 45.82, 10.49, 47.81];
const SPAIN_BOUNDS: [number, number, number, number] = [-9.5, 35.9, 4.4, 43.9];

// covers the whole world, also under the national orthophotos, past their borders
export const worldLayer: Layer3d = {
  title: 'Sentinel-2',
  image: 's2cloudless.jpg',
  // 2016 mosaic: CC BY 4.0 (the later years are non commercial)
  tiles: ['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg'],
  maxzoom: 14,
  attribution:
    '<a href="https://s2maps.eu" target="_blank" rel="noreferrer noopener">Sentinel-2 cloudless 2016 by EOX</a>' +
    ' (Contains modified Copernicus Sentinel data 2016)',
};

export const orthoLayers: Layer3d[] = [
  {
    title: 'IGN ortho',
    image: 'ignortho.jpg',
    country: 'fr',
    tiles: [ignFr('ORTHOIMAGERY.ORTHOPHOTOS')],
    maxzoom: 19,
    bounds: FRANCE_BOUNDS,
    attribution: '© IGN / Géoplateforme',
  },
  {
    title: 'SwissTopo ortho',
    image: 'swisstopoortho.jpg',
    country: 'ch',
    tiles: swisstopo('ch.swisstopo.swissimage'),
    maxzoom: 19,
    bounds: SWISS_BOUNDS,
    attribution: '© swisstopo',
  },
  {
    title: 'IGN ortho (es)',
    image: 'ignesortho.jpg',
    country: 'es',
    tiles: [
      'https://www.ign.es/wmts/pnoa-ma?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OI.OrthoimageCoverage' +
        '&STYLE=default&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg',
    ],
    maxzoom: 20,
    bounds: SPAIN_BOUNDS,
    attribution: 'Obra derivada de PNOA CC-BY 4.0 ign.es',
  },
];

export const slopeLayers: Layer3d[] = [
  {
    title: 'IGN Slopes',
    image: 'ignslopes.jpg',
    country: 'fr',
    tiles: [ignFr('GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN', 'png')],
    maxzoom: 17,
    bounds: FRANCE_BOUNDS,
    attribution: '© IGN',
  },
  {
    title: 'SwissTopo Slopes',
    image: 'swisstoposlopes.jpg',
    country: 'ch',
    tiles: swisstopo('ch.swisstopo.hangneigung-ueber_30', 'png'),
    maxzoom: 17,
    bounds: SWISS_BOUNDS,
    attribution: '© swisstopo',
  },
];

// the orthophoto of the country of a point, if we have one
export function orthoLayerAt(lon: number, lat: number): Layer3d | undefined {
  // Switzerland first: its box is inside the French one
  return [orthoLayers[1], orthoLayers[0], orthoLayers[2]].find(
    ({ bounds }) => bounds && lon >= bounds[0] && lon <= bounds[2] && lat >= bounds[1] && lat <= bounds[3]
  );
}

// colours of the relief layer, by elevation in metres: valleys green, rock brown and grey, snow white
export const reliefColors = [
  0,
  '#b7d39a',
  700,
  '#d9e0a6',
  1400,
  '#e6d3a3',
  2000,
  '#cfae8a',
  2600,
  '#b49c8c',
  3200,
  '#d6d6d6',
  3800,
  '#ffffff',
];
