import { describe, expect, it } from 'vitest';

import { writeGpx, writeKml } from './formats';
import { decodePolyline, encodePolyline } from './polyline';
import {
  extentFromLonLat,
  extentToLonLat,
  fromLonLat,
  geometryFromLonLat,
  geometryToLonLat,
  toLonLat,
} from './projection';
import { simplify } from './simplify';

// the expected values are those of OpenLayers, which did all this before
describe('projection', () => {
  it('goes from EPSG:3857 to longitude, latitude and back, keeping the elevation and the time', () => {
    expect(toLonLat([650000, 5700000, 1200.5, 1600000000])).toEqual([
      5.839049346776889, 45.496330778681, 1200.5, 1600000000,
    ]);
    const [x, y, z] = fromLonLat([5.839049346776889, 45.496330778681, 1200.5]);
    expect(x).toBeCloseTo(650000, 6);
    expect(y).toBeCloseTo(5700000, 6);
    expect(z).toBe(1200.5);
  });

  it('transforms extents and geometries', () => {
    const extent = extentToLonLat([650000, 5700000, 660000, 5710000]);
    expect(extentFromLonLat(extent).map(Math.round)).toEqual([650000, 5700000, 660000, 5710000]);
    const line = { type: 'MultiLineString', coordinates: [[[650000, 5700000, 1200]], [[650100, 5700100]]] };
    const back = geometryFromLonLat(geometryToLonLat(line));
    expect(back.type).toBe('MultiLineString');
    expect((back.coordinates as number[][][])[0][0].map(Math.round)).toEqual([650000, 5700000, 1200]);
    const collection = { type: 'GeometryCollection', geometries: [{ type: 'Point', coordinates: [0, 0] }] };
    expect(geometryToLonLat(collection).geometries[0].coordinates).toEqual([0, 0]);
  });
});

describe('simplify', () => {
  it('keeps the points away from the line, in 2D', () => {
    const points = [
      [0, 0, 100],
      [1, 0.1, 100],
      [2, 5, 100],
      [3, 0.2, 100],
      [4, 0, 100],
    ];
    expect(simplify(points, 1)).toEqual([
      [0, 0],
      [2, 5],
      [4, 0],
    ]);
    expect(simplify(points, 10)).toEqual([
      [0, 0],
      [4, 0],
    ]);
    expect(simplify(points.slice(0, 2), 10)).toEqual([
      [0, 0],
      [1, 0.1],
    ]);
  });
});

describe('encodePolyline', () => {
  it('encodes latitude first, at 1e5', () => {
    // the example of the Google documentation
    expect(
      encodePolyline([
        [-120.2, 38.5],
        [-120.95, 40.7],
        [-126.453, 43.252],
      ])
    ).toBe('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([
      [-120.2, 38.5],
      [-120.95, 40.7],
      [-126.453, 43.252],
    ]);
  });
});

describe('writeGpx / writeKml', () => {
  const GPX =
    '<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
    ' xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"' +
    ' version="1.1" creator="camptocamp.org"';
  const KML =
    '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2"' +
    ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
    ' xsi:schemaLocation="http://www.opengis.net/kml/2.2 https://developers.google.com/kml/schema/kml22gx.xsd"';
  const line = {
    type: 'LineString',
    coordinates: [
      [650000, 5700000, 1200.5, 1600000000],
      [650100, 5700100, 1210, 1600000060],
    ],
  };

  it('writes a line as a route, with its elevations and times', () => {
    expect(writeGpx([{ name: 'Tour <& "x">', geometry: line }])).toBe(
      `${GPX}><rte><name><![CDATA[Tour <& "x">]]></name>` +
        '<rtept lat="45.496330778681" lon="5.839049346776889"><ele>1200.5</ele><time>2020-09-13T12:26:40Z</time></rtept>' +
        '<rtept lat="45.496960453696005" lon="5.839947662061008"><ele>1210</ele><time>2020-09-13T12:27:40Z</time></rtept>' +
        '</rte></gpx>'
    );
    expect(writeGpx([{ geometry: line }], { decimals: 7 })).toContain('<rtept lat="45.4963308" lon="5.8390493">');
  });

  it('writes lines as a track, a point as a waypoint, and no polygon', () => {
    const multi = { type: 'MultiLineString', coordinates: [[[650000, 5700000]], [[650100, 5700100]]] };
    expect(writeGpx([{ geometry: multi }])).toBe(
      `${GPX}><trk><trkseg><trkpt lat="45.496330778681" lon="5.839049346776889"/></trkseg>` +
        '<trkseg><trkpt lat="45.496960453696005" lon="5.839947662061008"/></trkseg></trk></gpx>'
    );
    expect(writeGpx([{ name: 'P', geometry: { type: 'Point', coordinates: [650000, 5700000] } }])).toBe(
      `${GPX}><wpt lat="45.496330778681" lon="5.839049346776889"><name>P</name></wpt></gpx>`
    );
    expect(writeGpx([{ geometry: { type: 'Polygon', coordinates: [] } }])).toBe(`${GPX}/>`);
  });

  it('writes the names in CDATA only when needed', () => {
    const point = { type: 'Point', coordinates: [0, 0] };
    expect(writeKml([{ name: 'Voie normale > sud', geometry: point }])).toContain('<name>Voie normale &gt; sud</name>');
    expect(writeKml([{ name: 'a  b', geometry: point }])).toContain('<name><![CDATA[a  b]]></name>');
  });

  it('writes KML with the elevations, not the times', () => {
    expect(writeKml([{ name: 'Tour', geometry: line }])).toBe(
      `${KML}><Placemark><name>Tour</name><LineString><coordinates>` +
        '5.839049346776889,45.496330778681,1200.5 5.839947662061008,45.496960453696005,1210' +
        '</coordinates></LineString></Placemark></kml>'
    );
    const polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [650000, 5700000],
          [650100, 5700000],
          [650000, 5700000],
        ],
      ],
    };
    expect(writeKml([{ geometry: polygon }])).toBe(
      `${KML}><Placemark><Polygon><outerBoundaryIs><LinearRing><coordinates>` +
        '5.839049346776889,45.496330778681 5.839947662061008,45.496330778681 5.839049346776889,45.496330778681' +
        '</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark></kml>'
    );
  });
});
