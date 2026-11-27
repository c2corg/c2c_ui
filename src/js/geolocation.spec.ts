import { afterEach, describe, expect, it, vi } from 'vitest';

import { getPosition } from './geolocation';

const gettext = (text: string) => text;

// a browser whose geolocation answers with a position, or fails with an error code
const geolocation = (answer: { coords: object } | { code: number }) => {
  const getCurrentPosition = vi.fn((resolve: (position: object) => void, reject: (error: object) => void) =>
    'coords' in answer ? resolve(answer) : reject({ ...answer, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2 })
  );
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
  return getCurrentPosition;
};

describe('getPosition', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('gives the coordinates of the device', async () => {
    geolocation({ coords: { longitude: 6.86, latitude: 45.92 } });
    await expect(getPosition(gettext)).resolves.toEqual({ longitude: 6.86, latitude: 45.92 });
  });

  it('tells why it failed, in words for the user', async () => {
    geolocation({ code: 1 });
    await expect(getPosition(gettext)).rejects.toThrow('Location refused');
    geolocation({ code: 3 });
    await expect(getPosition(gettext)).rejects.toThrow('took too long');
  });

  it('tells when the browser cannot locate', async () => {
    vi.stubGlobal('navigator', {});
    await expect(getPosition(gettext)).rejects.toThrow('Geolocation is not supported by your browser.');
  });
});
