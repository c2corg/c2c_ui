import { describe, expect, it } from 'vitest';

import { imageUrlsOf, offlineImageUrlsOf, offlineLayersOf, offlineTilesOf, tileUrlsOf } from './offline-assets';
import { formerTileKeys, tileCacheKey } from './tile-key';

import config from '@/js/config';

// the XYZ tile of a point, from its longitude and latitude (the usual formula, not the one of offline-assets.ts)
const R = 6378137;
function tileOf([x, y]: number[], z: number) {
  const lon = (x / R) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
  const n = 2 ** z;
  const rad = (lat * Math.PI) / 180;
  return [
    Math.floor(((lon + 180) / 360) * n),
    Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n),
  ];
}

// the summit of the Aiguille du Midi, in EPSG:3857 as the API gives it
const MIDI = [764280, 5751080];

describe('the tiles of an offline document', () => {
  it('covers the geometry at each zoom, on the server OpenLayers picks', () => {
    const urls = tileUrlsOf({ geom: JSON.stringify({ type: 'Point', coordinates: MIDI }) });
    for (const z of [11, 12, 13, 14, 15]) {
      const [x, y] = tileOf(MIDI, z);
      expect(urls).toContain(`https://a.tile.opentopomap.org/${z}/${x}/${y}.png`);
    }
    // and only once each
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('prefers the detailed geometry, reads any type, and stops at 250 tiles', () => {
    const line = { type: 'LineString', coordinates: [MIDI, [MIDI[0] + 30000, MIDI[1] + 30000]] };
    const urls = tileUrlsOf({
      geom: JSON.stringify({ type: 'Point', coordinates: [0, 0] }),
      geom_detail: JSON.stringify({ type: 'GeometryCollection', geometries: [line] }),
    });
    expect(urls).toHaveLength(250);
    expect(urls.some((url) => url.includes('/0/0/0'))).toBe(false);
  });

  it('has none without a geometry', () => {
    expect(tileUrlsOf(null)).toEqual([]);
    expect(tileUrlsOf({ geom: 'not json' })).toEqual([]);
    expect(tileUrlsOf({ geom: null, geom_detail: null })).toEqual([]);
  });
});

describe('the images of an offline document', () => {
  it('takes the images of the text and the thumbnails of the gallery, once each', () => {
    const urls = imageUrlsOf({
      cooked: {
        lang: 'fr',
        description:
          '<p><img c2c:document-id="5" c2c:url-proxy="/images/proxy/5?size=MI" alt=""></p>' +
          '<img src="https://example.org/topo.png"><img src="https://example.org/topo.png">',
        remarks: null,
      },
      associations: { images: [{ document_id: 7, filename: '123_456.jpg' }] },
    });
    expect(urls).toEqual([
      // AVIF for all the images since c2corg/c2c_images#1160
      `${config.urls.media}/123_456MI.avif`,
      `${config.urls.api}/images/proxy/5?size=MI`,
      'https://example.org/topo.png',
    ]);
  });

  it('has none without text or images', () => {
    expect(imageUrlsOf({})).toEqual([]);
  });

  const gallery = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ document_id: 100 + i, filename: `123_${100 + i}.jpg` }));

  it('takes the BI images of a route too, the ones of the text first, at most 30', () => {
    const urls = offlineImageUrlsOf({
      type: 'r',
      cooked: { description: '<img c2c:document-id="5" c2c:url-proxy="/images/proxy/5?size=MI" alt="">' },
      associations: { images: gallery(40) },
    });
    const big = urls.filter((url) => /BI\.|size=BI/.test(url));
    expect(big).toHaveLength(30);
    expect(big[0]).toBe(`${config.urls.api}/images/proxy/5?size=BI&extension=avif`);
    expect(big[1]).toBe(`${config.urls.media}/123_100BI.avif`);
    expect(big).not.toContain(`${config.urls.media}/123_129BI.avif`);
    // and all the MI ones
    expect(urls).toContain(`${config.urls.media}/123_139MI.avif`);
  });

  it('takes an image of the text from the media server when the API gives its url, once if in the gallery too', () => {
    const urls = offlineImageUrlsOf({
      type: 'r',
      cooked: {
        description:
          `<img c2c:document-id="100" c2c:url-proxy="/images/proxy/100?size=MI" c2c:url="${config.urls.media}/123_100MI.jpg">` +
          `<img c2c:document-id="6" c2c:url-proxy="/images/proxy/6?size=MI" c2c:url="${config.urls.media}/123_6MI.jpg">`,
      },
      associations: { images: gallery(1) },
    });
    expect(urls.filter((url) => /BI\.|size=BI/.test(url))).toEqual([
      `${config.urls.media}/123_100BI.avif`,
      `${config.urls.media}/123_6BI.avif`,
    ]);
  });

  it('leaves the BI images out of what a document saved before them has', () => {
    const route = { type: 'r', associations: { images: gallery(2) } };
    expect(imageUrlsOf(route).filter((url) => url.includes('BI.'))).toEqual([]);
  });

  it('takes the BI images of a crag, not of the other waypoints and documents', () => {
    const bigOf = (document: { type: string; waypoint_type?: string }) =>
      offlineImageUrlsOf({ ...document, associations: { images: gallery(2) } }).filter((url) => url.includes('BI.'));
    expect(bigOf({ type: 'w', waypoint_type: 'climbing_outdoor' })).toHaveLength(2);
    expect(bigOf({ type: 'w', waypoint_type: 'hut' })).toEqual([]);
    expect(bigOf({ type: 'o' })).toEqual([]);
  });
});

describe('the key of a tile in the cache', () => {
  it('is the same whatever the server of OpenTopoMap, which each map picks its way', () => {
    expect(tileCacheKey('https://c.tile.opentopomap.org/13/4247/2905.png')).toBe(
      'https://a.tile.opentopomap.org/13/4247/2905.png'
    );
    expect(tileCacheKey('https://example.org/13/4247/2905.png')).toBe('https://example.org/13/4247/2905.png');
    // and of SwissTopo
    expect(tileCacheKey('https://wmts13.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/x/14/1/2.jpeg')).toBe(
      'https://wmts10.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/x/14/1/2.jpeg'
    );
  });

  it('was the letter OpenLayers picked before: the service worker looks for a missing tile there', () => {
    expect(formerTileKeys('https://a.tile.opentopomap.org/13/4247/2905.png')).toEqual([
      'https://b.tile.opentopomap.org/13/4247/2905.png',
      'https://c.tile.opentopomap.org/13/4247/2905.png',
    ]);
  });
});

// the Weisshorn, in Switzerland (EPSG:3857); a summit in the Écrins, in France
const WEISSHORN = [859990, 5796396];
const ECRINS = [711000, 5603000];
const SWITZERLAND = { document_id: 14067, area_type: 'country' };
const FRANCE = { document_id: 14274, area_type: 'country' };
const SPAIN = { document_id: 14267, area_type: 'country' };
const LLEIDA = { document_id: 279949, area_type: 'admin_limits' };
// Pedraforca, in Catalonia
const PEDRAFORCA = [192500, 5175900];
const pointAt = (xy: number[]) => ({ geom: JSON.stringify({ type: 'Point', coordinates: xy }) });
const titles = (document: Parameters<typeof offlineLayersOf>[0]) =>
  offlineLayersOf(document).map(({ layer }) => layer.title);

describe('the map layers of an offline document', () => {
  it('takes OpenTopoMap, SwissTopo in Switzerland, the slopes of the country for snow and ice', () => {
    expect(titles({ areas: [FRANCE], activities: ['rock_climbing'] })).toEqual(['OpenTopoMap']);
    expect(titles({ areas: [SWITZERLAND], activities: ['mountain_climbing'] })).toEqual(['OpenTopoMap', 'SwissTopo']);
    expect(titles({ areas: [SWITZERLAND], activities: ['skitouring'] })).toEqual([
      'OpenTopoMap',
      'SwissTopo',
      'SwissTopo Slopes',
    ]);
    // never the IGN maps (their licence): the IGN slopes only
    expect(titles({ areas: [FRANCE], activities: ['ice_climbing'] })).toEqual(['OpenTopoMap', 'IGN Slopes']);
    // on the border, both
    expect(titles({ areas: [FRANCE, SWITZERLAND], activities: ['snow_ice_mixed'] })).toEqual([
      'OpenTopoMap',
      'SwissTopo',
      'SwissTopo Slopes',
      'IGN Slopes',
    ]);
  });

  it('takes the map of the IGN of Spain in Spain, that of the ICGC alone in Catalonia', () => {
    expect(titles({ areas: [SPAIN] })).toEqual(['OpenTopoMap', 'IGN raster (es)']);
    expect(titles({ areas: [SPAIN, LLEIDA] })).toEqual(['OpenTopoMap', 'ICGC raster (ca)']);
    expect(titles({ areas: [FRANCE, SPAIN], activities: ['skitouring'] })).toEqual([
      'OpenTopoMap',
      'IGN Slopes',
      'IGN raster (es)',
    ]);
  });

  it('writes the WMS tiles of the ICGC with the bounding box MapLibre asks for', async () => {
    const { urls, layers } = offlineTilesOf({ geometry: pointAt(PEDRAFORCA), areas: [SPAIN, LLEIDA] });
    expect(layers['ICGC raster (ca)']).toBe(15);
    const [x, y] = tileOf(PEDRAFORCA, 14);
    // the url MapLibre asks for (its source, not type-checked: the class is not exported, its sources not strict)
    const tileIdModule = '../../node_modules/maplibre-gl/src/tile/tile_id';
    const { CanonicalTileID } = (await import(/* @vite-ignore */ tileIdModule)) as {
      CanonicalTileID: new (z: number, x: number, y: number) => { url(urls: string[], pixelRatio: number): string };
    };
    const bbox = new CanonicalTileID(14, x, y).url(['{bbox-epsg-3857}'], 1);
    expect(urls.filter((url) => url.startsWith('https://geoserveis.icgc.cat/'))).toContain(
      'https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wms/service?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap' +
        `&FORMAT=image/jpeg&LAYERS=topo&STYLES=&CRS=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX=${bbox}`
    );
  });

  it('downloads every zoom of each layer, as the map asks for them, with the highest zoom kept', () => {
    const { urls, layers } = offlineTilesOf({
      geometry: pointAt(WEISSHORN),
      areas: [SWITZERLAND],
      activities: ['skitouring'],
    });
    expect(layers).toEqual({ OpenTopoMap: 15, SwissTopo: 16, 'SwissTopo Slopes': 15 });
    // OpenTopoMap: the same tiles as before
    expect(urls.filter((url) => url.includes('opentopomap'))).toEqual(tileUrlsOf(pointAt(WEISSHORN)));
    for (const z of [12, 13, 14, 15, 16]) {
      const [x, y] = tileOf(WEISSHORN, z);
      expect(urls).toContain(
        `https://wmts10.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/${z}/${x}/${y}.jpeg`
      );
    }
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('keeps the IGN slopes in the layout of their WMTS urls', () => {
    const { urls } = offlineTilesOf({ geometry: pointAt(ECRINS), areas: [FRANCE], activities: ['skitouring'] });
    const [x, y] = tileOf(ECRINS, 14);
    expect(urls).toContain(
      'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN' +
        `&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX=14&TILEROW=${y}&TILECOL=${x}&FORMAT=image/png`
    );
  });

  it('past the budget of a layer, takes the band along the track; past it again, stops that layer', () => {
    // a 16 km track: its whole extent at zoom 16 is too many SwissTopo tiles, the band is not
    const track = [WEISSHORN, [WEISSHORN[0] - 15000, WEISSHORN[1] + 5000]];
    const geometry = { ...pointAt(WEISSHORN), geom_detail: JSON.stringify({ type: 'LineString', coordinates: track }) };
    const { urls, layers } = offlineTilesOf({ geometry, areas: [SWITZERLAND] });
    expect(layers).toEqual({ OpenTopoMap: 15, SwissTopo: 16 });
    const swiss16 = urls.filter((url) => url.includes('pixelkarte') && url.includes('/3857/16/'));
    expect(swiss16.length).toBeGreaterThan(0);
    expect(swiss16.length).toBeLessThan(400);
    // the band: not the corner of the extent away from the track (north-east), but the start of the track
    const tileUrl16 = ([x, y]: number[]) => `/3857/16/${x}/${y}.jpeg`;
    const farCorner = tileOf([WEISSHORN[0] + 1500, WEISSHORN[1] + 6500], 16);
    expect(swiss16.some((url) => url.endsWith(tileUrl16(farCorner)))).toBe(false);
    expect(swiss16.some((url) => url.endsWith(tileUrl16(tileOf(WEISSHORN, 16))))).toBe(true);
    // the tiles of the zooms below are the whole extent
    expect(
      urls.some(
        (url) =>
          url.includes('pixelkarte') &&
          url.endsWith(`/3857/15/${tileOf([WEISSHORN[0] + 1500, WEISSHORN[1] + 6500], 15).join('/')}.jpeg`)
      )
    ).toBe(true);

    // a 60 km crossing: even the band is past the budget at the high zooms
    const long = [WEISSHORN, [WEISSHORN[0] - 80000, WEISSHORN[1] + 20000]];
    const crossing = offlineTilesOf({
      geometry: { ...pointAt(WEISSHORN), geom_detail: JSON.stringify({ type: 'LineString', coordinates: long }) },
      areas: [SWITZERLAND],
    });
    expect(crossing.layers.SwissTopo).toBeLessThan(16);
    expect(crossing.urls.filter((url) => url.includes('pixelkarte')).length).toBeLessThanOrEqual(600);
    expect(crossing.urls.filter((url) => url.includes('opentopomap')).length).toBeLessThanOrEqual(400);
  });

  it('covers the waypoints of a route without a track, in circles when the whole extent is too many tiles', () => {
    const waypointAt = (xy: number[]) => ({ geometry: { geom: JSON.stringify({ type: 'Point', coordinates: xy }) } });
    const otm15 = (urls: string[]) => urls.filter((url) => url.includes('opentopomap.org/15/'));
    const has = (urls: string[], xy: number[]) =>
      urls.includes(`https://a.tile.opentopomap.org/15/${tileOf(xy, 15).join('/')}.png`);

    // its hut 6 km away
    const hut = [WEISSHORN[0] + 6000, WEISSHORN[1] - 3000];
    const near = offlineTilesOf({ geometry: pointAt(WEISSHORN), associations: { waypoints: [waypointAt(hut)] } });
    expect(has(near.urls, hut)).toBe(true);
    // between them too: the whole extent
    expect(has(near.urls, [WEISSHORN[0] + 3000, WEISSHORN[1] - 1500])).toBe(true);
    expect(near.layers.OpenTopoMap).toBe(15);

    // an access 40 km away: at zoom 15, circles around the point and the waypoints, not the land between
    const far = [WEISSHORN[0] + 40000, WEISSHORN[1] - 20000];
    const wide = offlineTilesOf({
      geometry: pointAt(WEISSHORN),
      associations: { waypoint_children: [waypointAt(far)] },
    });
    expect(wide.layers.OpenTopoMap).toBe(15);
    expect(has(wide.urls, WEISSHORN)).toBe(true);
    expect(has(wide.urls, far)).toBe(true);
    expect(has(wide.urls, [WEISSHORN[0] + 20000, WEISSHORN[1] - 10000])).toBe(false);
    expect(otm15(wide.urls).length).toBeLessThan(100);

    // an outing: the waypoints of its routes
    const outing = offlineTilesOf({
      geometry: pointAt(WEISSHORN),
      associations: { route_waypoints: [waypointAt(far)] },
    });
    expect(has(outing.urls, far)).toBe(true);
    // even without a geometry of its own
    const located = offlineTilesOf({ geometry: null, associations: { route_waypoints: [waypointAt(far)] } });
    expect(has(located.urls, far)).toBe(true);
  });

  it('has none without a geometry', () => {
    expect(offlineTilesOf({ geometry: null })).toEqual({ urls: [], layers: {} });
  });
});
