import { describe, expect, it } from 'vitest';

import { assetUrl, itinevertBanners } from './asset-urls';

describe('assetUrl', () => {
  it.each([
    ['boxes', 'bus.svg'],
    ['flags', 'fr.svg'],
    ['layers', 'opentopomap.jpg'],
    ['tracking', 'strava.png'],
    ['yeti/layers', 'avalanche.jpg'],
    ['yeti/legends', 'winter-route-icon1.png'],
  ])('returns the url of %s/%s', (folder, fileName) => {
    const url = assetUrl(folder, fileName);

    expect(url).toEqual(expect.any(String));
    expect(url).toContain(fileName.replace(/\.\w+$/, ''));
  });

  it('throws on a missing image, as the webpack require() did', () => {
    // yeti LayerButton relies on it to fall back to no background image
    expect(() => assetUrl('yeti/layers', 'missing.jpg')).toThrow("Cannot find image 'yeti/layers/missing.jpg'");
    expect(() => assetUrl('yeti/layers', undefined)).toThrow();
  });

  it('throws on an unknown folder', () => {
    expect(() => assetUrl('unknown', 'fr.svg')).toThrow();
  });

  it('does not mix up folders that contain the same file name', () => {
    expect(assetUrl('layers', 'ign.jpg')).not.toBe(assetUrl('yeti/layers', 'ign.jpg'));
  });
});

describe('itinevertBanners', () => {
  it('lists every banner image', () => {
    expect(itinevertBanners).toHaveLength(12);
    itinevertBanners.forEach((url) => expect(url).toEqual(expect.any(String)));
  });
});
