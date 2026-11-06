import { describe, expect, it } from 'vitest';

import { imageUrlsOf, tileUrlsOf } from './offline-assets';

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
      const server = 'abc'[((x << z) + y) % 3];
      expect(urls).toContain(`https://${server}.tile.opentopomap.org/${z}/${x}/${y}.png`);
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
      `${config.urls.media}/123_456MI.jpg`,
      `${config.urls.api}/images/proxy/5?size=MI`,
      'https://example.org/topo.png',
    ]);
  });

  it('has none without text or images', () => {
    expect(imageUrlsOf({})).toEqual([]);
  });
});
