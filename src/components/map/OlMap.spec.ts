import { describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import { mountMap } from './test-utils';

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
});
