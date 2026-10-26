import { describe, expect, it } from 'vitest';

import { parseMetaData } from './upload-file';

// metadata as blueimp-load-image gives them
const metadata = (exif: Record<string, unknown> | null, iptc: Record<string, unknown> | null = null) => ({
  exif: exif && { getAll: () => exif, get: (name: string) => exif[name] },
  iptc: iptc && { getAll: () => iptc, get: (name: string) => iptc[name] },
});

describe('upload-file parseMetaData', () => {
  it('reads the date, camera, exposure and position of the EXIF data, and returns the orientation', () => {
    const document: Record<string, unknown> = {};

    const orientation = parseMetaData(
      document,
      metadata({
        Orientation: 6,
        Make: 'Canon',
        Model: 'EOS',
        Exif: {
          DateTimeOriginal: '2026:01:10 08:30:00',
          OffsetTimeOriginal: '+01:00',
          ExposureTime: 0.004,
          FNumber: 8,
        },
        GPSInfo: {
          GPSLatitude: '45,10,30',
          GPSLatitudeRef: 'N',
          GPSLongitude: '5,43,12',
          GPSLongitudeRef: 'E',
          GPSAltitude: '2100.5',
        },
      })
    );

    expect(orientation).toBe(6);
    expect(document).toMatchObject({
      camera_name: 'Canon EOS',
      exposure_time: 0.004,
      fnumber: 8,
      elevation: 2100.5,
    });
    const { coordinates } = JSON.parse((document.geometry as { geom: string }).geom);
    // the time of the shot, with its offset
    expect(Date.parse(document.date_time as string)).toBe(Date.parse('2026-01-10T08:30:00+01:00'));
    expect(coordinates[0]).toBeCloseTo(636_747.5, 0); // 5°43'12" E, in Web Mercator
    expect(coordinates[1]).toBeGreaterThan(5_600_000);
  });

  it('prefers the IPTC date, and ignores a position out of the world or a missing one', () => {
    const document: Record<string, unknown> = {};

    parseMetaData(
      document,
      metadata({ GPSInfo: { GPSLatitude: '95,0,0', GPSLongitude: '5,0,0' } }, { DateCreated: '20260110' })
    );

    expect(document.date_time).toMatch(/^2026-01-10T00:00:00/);
    expect(document.geometry).toBeUndefined();
    expect(parseMetaData({}, metadata(null))).toBe(0);
  });
});
