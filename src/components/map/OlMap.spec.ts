import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import { mountMap } from './test-utils';

import { toLonLat } from '@/js/geo/projection';
import { useOfflineStore } from '@/stores/offline';

// the point markers draw Font Awesome icons, which the specs don't load: plain styles instead
vi.mock('@/components/map/map-utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/map/map-utils')>()),
  getDocumentPointStyle: () => [],
}));

// a GPS track: its second point has no elevation (0), 50 m from the first
const GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg>
<trkpt lat="45.9" lon="6.8"><ele>1000</ele></trkpt>
<trkpt lat="45.9003" lon="6.8003"><ele>0</ele></trkpt>
<trkpt lat="45.91" lon="6.81"><ele>1200</ele></trkpt>
</trkseg></trk></gpx>`;

describe('the edition map', () => {
  it('without a network, shows the downloaded base layer and says so, then the layers chosen again', async () => {
    const editedDocument = reactive({ type: 'o', geometry: { geom: null, geom_detail: null } });
    const { wrapper, vm } = await mountMap({ editedDocument });
    const layers = vm.map.getLayers().getArray();
    const titled = (title: string) => layers.find((layer) => layer.get('title') === title)!;
    titled('OpenTopoMap').setVisible(false);
    titled('IGN maps').setVisible(true);
    titled('IGN Slopes').setVisible(true);

    useOfflineStore().online = false;
    await flushPromises();
    expect(titled('OpenTopoMap').getVisible()).toBe(true);
    expect(titled('IGN maps').getVisible()).toBe(false);
    expect(titled('IGN Slopes').getVisible()).toBe(false);
    expect(wrapper.find('.ol-map-offline-notice').text()).toContain('IGN maps');

    useOfflineStore().online = true;
    await flushPromises();
    expect(titled('IGN maps').getVisible()).toBe(true);
    expect(titled('IGN Slopes').getVisible()).toBe(true);
    expect(titled('OpenTopoMap').getVisible()).toBe(false);
    expect(wrapper.find('.ol-map-offline-notice').exists()).toBe(false);
    wrapper.unmount();
  });

  it('fixes the missing GPS elevations of a route track, not of an outing one', async () => {
    const elevations = async (type: string) => {
      const editedDocument = reactive({ type, geometry: { geom: null, geom_detail: null } as Record<string, unknown> });
      const { wrapper, vm } = await mountMap({ editedDocument, geomDetailEditable: true });

      vm.setDocumentGeometryFromGeoFile(GPX);

      // a GPX track is a MultiLineString
      const track = JSON.parse(editedDocument.geometry.geom_detail as string) as { coordinates: number[][][] };
      wrapper.unmount();
      return track.coordinates[0].map((coord) => coord[2]);
    };

    // the point without elevation, close to the first one, takes its elevation
    expect(await elevations('r')).toEqual([1000, 1000, 1200]);
    // the outing tracks stay as recorded (it read the type of window.document: always fixed)
    expect(await elevations('o')).toEqual([1000, 0, 1200]);
  });

  describe('reads all the tracks of a GPS file', () => {
    const gpx = (content: string) =>
      `<?xml version="1.0"?><gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">${content}</gpx>`;
    const pt = (tag: string, lat: number, lon: number) => `<${tag} lat="${lat}" lon="${lon}"><ele>1000</ele></${tag}>`;
    const segment = (lat: number) => `<trkseg>${pt('trkpt', lat, 6.8)}${pt('trkpt', lat + 0.01, 6.81)}</trkseg>`;

    const readFile = async (file: string, type = 'o') => {
      const editedDocument = reactive({
        type,
        date_start: undefined as string | undefined,
        geometry: { geom: null, geom_detail: null } as Record<string, unknown>,
      });
      const { wrapper, vm } = await mountMap({ editedDocument, geomDetailEditable: true });

      vm.setDocumentGeometryFromGeoFile(file);

      wrapper.unmount();
      const parse = <T>(value: unknown) =>
        value ? (JSON.parse(value as string) as { type: string; coordinates: T }) : null;
      return {
        dateStart: editedDocument.date_start,
        geom: parse<number[]>(editedDocument.geometry.geom),
        // a LineString (number[][]) for a GPX route
        geomDetail: parse<number[][][]>(editedDocument.geometry.geom_detail),
      };
    };
    // the latitudes of the first point of each line, back in WGS 84
    const firstLatitudes = (lines: number[][][]) => lines.map((line) => Math.round(toLonLat(line[0])[1] * 100) / 100);

    it('keeps both tracks of a file with two tracks', async () => {
      const { geomDetail } = await readFile(gpx(`<trk>${segment(45.9)}</trk><trk>${segment(46.1)}</trk>`));

      expect(geomDetail!.type).toBe('MultiLineString');
      expect(firstLatitudes(geomDetail!.coordinates)).toEqual([45.9, 46.1]);
    });

    it('keeps both segments of a track with two segments', async () => {
      const { geomDetail } = await readFile(gpx(`<trk>${segment(45.9)}${segment(46.1)}</trk>`));

      expect(geomDetail!.type).toBe('MultiLineString');
      expect(firstLatitudes(geomDetail!.coordinates)).toEqual([45.9, 46.1]);
    });

    it('keeps all the segments of several tracks, in order', async () => {
      const { geomDetail } = await readFile(
        gpx(`<trk>${segment(45.9)}${segment(46.0)}</trk><trk>${segment(46.1)}</trk>`)
      );

      expect(firstLatitudes(geomDetail!.coordinates)).toEqual([45.9, 46.0, 46.1]);
    });

    it('reads a file with a route only', async () => {
      const { geomDetail } = await readFile(gpx(`<rte>${pt('rtept', 45.9, 6.8)}${pt('rtept', 45.91, 6.81)}</rte>`));

      expect(geomDetail!.type).toBe('LineString');
      expect(geomDetail!.coordinates).toHaveLength(2);
    });

    it('merges tracks with and without times, keeping the dimensions they share', async () => {
      const timed = `<trk><trkseg><trkpt lat="45.9" lon="6.8"><ele>1000</ele><time>2026-01-01T08:00:00Z</time></trkpt>
        <trkpt lat="45.91" lon="6.81"><ele>1100</ele><time>2026-01-01T09:00:00Z</time></trkpt></trkseg></trk>`;
      const { geomDetail } = await readFile(gpx(`${timed}<trk>${segment(46.1)}</trk>`));

      expect(geomDetail!.coordinates.flat().map((coord) => coord.length)).toEqual([3, 3, 3, 3]);
      expect(geomDetail!.coordinates[0].map((coord) => coord[2])).toEqual([1000, 1100]);
    });

    it('keeps the waypoint of a file with a waypoint and tracks', async () => {
      const { geom, geomDetail } = await readFile(
        gpx(`${pt('wpt', 45.5, 6.5)}<trk>${segment(45.9)}</trk><trk>${segment(46.1)}</trk>`)
      );

      expect(Math.round(toLonLat(geom!.coordinates)[1] * 10) / 10).toBe(45.5);
      expect(geomDetail!.coordinates).toHaveLength(2);
    });

    describe('the order of the tracks', () => {
      const timedTrack = (lat: number, day: string) =>
        `<trk><trkseg><trkpt lat="${lat}" lon="6.8"><ele>1000</ele><time>${day}T12:00:00Z</time></trkpt>
        <trkpt lat="${lat + 0.01}" lon="6.81"><ele>1100</ele><time>${day}T13:00:00Z</time></trkpt></trkseg></trk>`;

      it('follows the times, when all the tracks have times', async () => {
        const { geomDetail } = await readFile(
          gpx(`${timedTrack(46.1, '2026-01-03')}${timedTrack(45.9, '2026-01-01')}${timedTrack(46.0, '2026-01-02')}`)
        );

        expect(firstLatitudes(geomDetail!.coordinates)).toEqual([45.9, 46.0, 46.1]);
        // the times are kept
        expect(geomDetail!.coordinates.flat().every((coord) => coord.length === 4)).toBe(true);
      });

      it('follows the times for the segments of a single track', async () => {
        const timedSegment = (track: string) => track.replace(/^<trk>(.*)<\/trk>$/s, '$1');
        const { geomDetail } = await readFile(
          gpx(
            `<trk>${timedSegment(timedTrack(46.1, '2026-01-02'))}${timedSegment(timedTrack(45.9, '2026-01-01'))}</trk>`
          )
        );

        expect(firstLatitudes(geomDetail!.coordinates)).toEqual([45.9, 46.1]);
      });

      it('is the order of the file, when a track has no times', async () => {
        const { geomDetail } = await readFile(
          gpx(`${timedTrack(46.1, '2026-01-03')}<trk>${segment(45.8)}</trk>${timedTrack(45.9, '2026-01-01')}`)
        );

        expect(firstLatitudes(geomDetail!.coordinates)).toEqual([46.1, 45.8, 45.9]);
      });
    });

    describe('the outing date', () => {
      const timedTrack = (lat: number, day: string) =>
        `<trk><trkseg><trkpt lat="${lat}" lon="6.8"><ele>1000</ele><time>${day}T12:00:00Z</time></trkpt>
        <trkpt lat="${lat + 0.01}" lon="6.81"><ele>1100</ele><time>${day}T13:00:00Z</time></trkpt></trkseg></trk>`;

      it('is read from the first timed track, when another track has no times', async () => {
        const { dateStart, geomDetail } = await readFile(
          gpx(`<trk>${segment(45.8)}</trk>${timedTrack(45.9, '2026-01-01')}${timedTrack(46.1, '2026-02-01')}`)
        );

        // the merged track has no times (the first track has none): the date still comes from the tracks
        expect(geomDetail!.coordinates.flat().every((coord) => coord.length === 3)).toBe(true);
        // the specs' $dateUtils.toLocalizedString gives the date back as is
        expect(dateStart).toEqual(new Date('2026-01-01T12:00:00Z'));
      });

      it('is read from the earliest track, when the tracks of the file are not in order', async () => {
        const { dateStart } = await readFile(gpx(`${timedTrack(46.1, '2026-02-01')}${timedTrack(45.9, '2026-01-01')}`));

        expect(dateStart).toEqual(new Date('2026-01-01T12:00:00Z'));
      });

      it('is not set when no track has times', async () => {
        const { dateStart } = await readFile(gpx(`<trk>${segment(45.9)}</trk><trk>${segment(46.1)}</trk>`));

        expect(dateStart).toBeUndefined();
      });
    });

    describe('of an area', () => {
      // a closed square of 0.01°, its south west corner at lat, lon
      const square = (lat: number, lon: number) =>
        `<trk><trkseg>${[
          [lat, lon],
          [lat, lon + 0.01],
          [lat + 0.01, lon + 0.01],
          [lat + 0.01, lon],
          [lat, lon],
        ]
          .map(([la, lo]) => pt('trkpt', la, lo))
          .join('')}</trkseg></trk>`;

      it('makes a polygon of each track, not holes of the first one', async () => {
        // the second square is outside of the first: as a hole of it, the area would be invalid
        const { geomDetail } = await readFile(gpx(`${square(45.9, 6.8)}${square(46.1, 7.0)}`), 'a');
        const polygons = geomDetail!.coordinates as unknown as number[][][][];

        expect(geomDetail!.type).toBe('MultiPolygon');
        expect(polygons).toHaveLength(2);
        polygons.forEach((polygon) => {
          // one exterior ring, no hole, closed and in 2D
          expect(polygon).toHaveLength(1);
          expect(polygon[0]).toHaveLength(5);
          expect(polygon[0][0]).toEqual(polygon[0][4]);
          expect(polygon[0][0]).toHaveLength(2);
        });
        expect(polygons.map((polygon) => firstLatitudes(polygon))).toEqual([[45.9], [46.1]]);
      });

      it('closes the tracks that are not closed', async () => {
        const open = `<trk><trkseg>${pt('trkpt', 46.1, 7.0)}${pt('trkpt', 46.1, 7.01)}${pt('trkpt', 46.11, 7.01)}</trkseg></trk>`;
        const { geomDetail } = await readFile(gpx(`${square(45.9, 6.8)}${open}`), 'a');
        const ring = (geomDetail!.coordinates as unknown as number[][][][])[1][0];

        expect(ring).toHaveLength(4);
        expect(ring[0]).toEqual(ring[3]);
      });

      it('still makes a polygon of a single track', async () => {
        const { geomDetail } = await readFile(gpx(square(45.9, 6.8)), 'a');

        expect(geomDetail!.type).toBe('Polygon');
      });

      it('skips the empty segments', async () => {
        // OpenLayers keeps <trkseg/> as an empty line: it has no ends to close
        const withEmptySegment = square(45.9, 6.8).replace('</trk>', '<trkseg/></trk>');
        const { geomDetail } = await readFile(gpx(`${withEmptySegment}${square(46.1, 7.0)}`), 'a');
        const polygons = geomDetail!.coordinates as unknown as number[][][][];

        expect(polygons).toHaveLength(2);
        expect(polygons.map((polygon) => firstLatitudes(polygon))).toEqual([[45.9], [46.1]]);
      });

      it('leaves the area as it is when all the tracks are empty', async () => {
        const { geomDetail } = await readFile(gpx('<trk><trkseg/></trk><trk><trkseg/></trk>'), 'a');

        expect(geomDetail).toBeNull();
      });
    });

    it('skips the empty segments of a single track', async () => {
      const { geomDetail } = await readFile(gpx(`<trk><trkseg/>${segment(45.9)}</trk>`));

      expect(firstLatitudes(geomDetail!.coordinates)).toEqual([45.9]);
    });

    it('skips the empty segments, keeping the elevations of the other tracks', async () => {
      const { geomDetail } = await readFile(gpx(`<trk>${segment(45.9)}<trkseg/></trk><trk>${segment(46.1)}</trk>`));

      expect(firstLatitudes(geomDetail!.coordinates)).toEqual([45.9, 46.1]);
      expect(geomDetail!.coordinates.flat().map((coord) => coord[2])).toEqual([1000, 1000, 1000, 1000]);
    });
  });
});
