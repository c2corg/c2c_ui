import { describe, expect, it } from 'vitest';

import { activityDevice, activitySources, shortDeviceName, vendorNames } from './activity-device';

const translate = (vendor: string) => vendor.charAt(0).toUpperCase() + vendor.slice(1);

describe('shortDeviceName', () => {
  it('removes the vendor name from the device name', () => {
    expect(shortDeviceName('COROS APEX 4', ['coros'])).toBe('APEX 4');
    expect(shortDeviceName('Garmin Forerunner 965', vendorNames(['garmin'], translate))).toBe('Forerunner 965');
  });

  it('removes it wherever it is', () => {
    expect(shortDeviceName('Forerunner 965 (Garmin)', ['garmin'])).toBe('Forerunner 965');
    expect(shortDeviceName('Edge 1040 - Garmin', ['garmin'])).toBe('Edge 1040');
  });

  it('removes whole words only', () => {
    expect(shortDeviceName('Polaris 2', ['polar'])).toBe('Polaris 2');
  });

  it('keeps device names without vendor name', () => {
    expect(shortDeviceName('Forerunner 965', ['garmin'])).toBe('Forerunner 965');
    expect(shortDeviceName('Edge 1040+', ['garmin'])).toBe('Edge 1040+');
  });

  it('removes the names of every vendor of a grouped activity', () => {
    const names = vendorNames(['strava', 'garmin'], translate);
    expect(shortDeviceName('Garmin Forerunner 965', names)).toBe('Forerunner 965');
    expect(shortDeviceName('Strava iPhone', names)).toBe('iPhone');
  });

  it('is undefined when only vendor names are left', () => {
    expect(shortDeviceName('STRAVA', ['strava'])).toBeUndefined();
    expect(shortDeviceName('Garmin Strava', ['strava', 'garmin'])).toBeUndefined();
    expect(shortDeviceName('  ', ['strava'])).toBeUndefined();
    expect(shortDeviceName(undefined, ['strava'])).toBeUndefined();
  });

  it('removes the translated vendor name', () => {
    expect(
      shortDeviceName(
        'Décathlon Watch',
        vendorNames(['decathlon'], () => 'Décathlon')
      )
    ).toBe('Watch');
  });
});

describe('activityDevice', () => {
  it('names a device once, the most precise name', () => {
    expect(
      activityDevice(
        [
          { vendor: 'strava', deviceName: 'APEX 4' },
          { vendor: 'coros', deviceName: 'COROS APEX 4 46mm' },
        ],
        translate
      )
    ).toEqual({ name: 'APEX 4 46mm', fullName: 'COROS APEX 4 46mm' });
  });

  it('removes duplicates', () => {
    expect(
      activityDevice(
        [
          { vendor: 'strava', deviceName: 'Garmin Forerunner 965' },
          { vendor: 'garmin', deviceName: 'forerunner 965' },
        ],
        translate
      ).name
    ).toBe('Forerunner 965');
  });

  it('lists different devices', () => {
    expect(
      activityDevice(
        [
          { vendor: 'strava', deviceName: 'iPhone' },
          { vendor: 'garmin', deviceName: 'Edge 1040' },
        ],
        translate
      ).name
    ).toBe('iPhone / Edge 1040');
  });

  it('has no device when no vendor names one', () => {
    expect(activityDevice([{ vendor: 'strava' }, { vendor: 'garmin', deviceName: 'Garmin' }], translate)).toEqual({
      name: undefined,
      fullName: 'Garmin',
    });
  });
});

describe('activitySources', () => {
  it('puts Strava first', () => {
    const coros = { vendor: 'coros' };
    const strava = { vendor: 'strava' };
    expect(activitySources({ ...coros, sources: [coros, strava] })).toEqual([strava, coros]);
    expect(activitySources({ ...strava, sources: [strava, coros] })).toEqual([strava, coros]);
  });

  it('is the activity without sources', () => {
    const garmin = { vendor: 'garmin' };
    expect(activitySources(garmin)).toEqual([garmin]);
  });
});
