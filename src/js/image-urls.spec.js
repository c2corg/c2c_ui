import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getEmbeddedImageUrl, getImageUrl } from './image-urls';

// '@/js/config' reads CAMPTOCAMP_CONFIG, a constant injected by Vite (see vite.config.mjs)
const config = vi.hoisted(() => ({ urls: {} }));
vi.mock('@/js/config', () => ({ default: config }));

const API = 'https://api.example.org';
const MEDIA = 'https://media.example.org';

beforeEach(() => {
  config.urls = { api: API, media: MEDIA, modernThumbnailsTimestamp: 0, modernThumbnailsId: 0 };
});

describe('getImageUrl', () => {
  describe('with a filename', () => {
    const image = { document_id: 42, filename: '1588000000_123456.jpg' };

    it('returns the original image without size', () => {
      expect(getImageUrl(image)).toBe(`${MEDIA}/1588000000_123456.jpg`);
    });

    it.each(['SI', 'MI', 'BI'])('returns the %s thumbnail', (size) => {
      expect(getImageUrl(image, size)).toBe(`${MEDIA}/1588000000_123456${size}.jpg`);
    });

    it.each(['XL', 'si', 'small'])('throws on invalid size %j', (size) => {
      expect(() => getImageUrl(image, size)).toThrow('Invalid size');
    });

    it('returns jpg thumbnails for svg images', () => {
      expect(getImageUrl({ document_id: 1, filename: '1588000000_1.svg' }, 'MI')).toBe(`${MEDIA}/1588000000_1MI.jpg`);
    });

    it('returns the original svg without size', () => {
      expect(getImageUrl({ document_id: 1, filename: '1588000000_1.svg' })).toBe(`${MEDIA}/1588000000_1.svg`);
    });

    it('keeps other extensions for thumbnails', () => {
      expect(getImageUrl({ document_id: 1, filename: '1588000000_1.png' }, 'SI')).toBe(`${MEDIA}/1588000000_1SI.png`);
    });

    it('ignores format without size', () => {
      config.urls.modernThumbnailsTimestamp = 1;
      expect(getImageUrl(image, undefined, 'webp')).toBe(`${MEDIA}/1588000000_123456.jpg`);
    });

    describe('with a modern format', () => {
      it('returns undefined when modern thumbnails are disabled', () => {
        expect(getImageUrl(image, 'MI', 'webp')).toBeUndefined();
      });

      it('returns undefined for images older than modernThumbnailsTimestamp', () => {
        config.urls.modernThumbnailsTimestamp = 1588000001;
        expect(getImageUrl(image, 'MI', 'webp')).toBeUndefined();
      });

      it.each(['webp', 'avif'])('returns the %s thumbnail from modernThumbnailsTimestamp on', (format) => {
        config.urls.modernThumbnailsTimestamp = 1588000000;
        expect(getImageUrl(image, 'MI', format)).toBe(`${MEDIA}/1588000000_123456MI.${format}`);
        expect(getImageUrl({ document_id: 1, filename: '1700000000_1.png' }, 'BI', format)).toBe(
          `${MEDIA}/1700000000_1BI.${format}`
        );
      });

      it('replaces the jpg extension of svg thumbnails', () => {
        config.urls.modernThumbnailsTimestamp = 1;
        expect(getImageUrl({ document_id: 1, filename: '1588000000_1.svg' }, 'SI', 'webp')).toBe(
          `${MEDIA}/1588000000_1SI.webp`
        );
      });

      it('returns undefined when the filename has no numeric timestamp', () => {
        config.urls.modernThumbnailsTimestamp = 1;
        expect(getImageUrl({ document_id: 1, filename: 'abc.jpg' }, 'SI', 'webp')).toBeUndefined();
      });

      it('validates the size before the format', () => {
        expect(() => getImageUrl(image, 'XL', 'webp')).toThrow('Invalid size');
      });
    });
  });

  describe('without a filename (image proxy)', () => {
    const image = { document_id: 42 };

    it('returns the proxy url without size', () => {
      expect(getImageUrl(image)).toBe(`${API}/images/proxy/42`);
    });

    it('returns the proxy url with size', () => {
      expect(getImageUrl(image, 'MI')).toBe(`${API}/images/proxy/42?size=MI`);
    });

    it('does not validate the size', () => {
      expect(getImageUrl(image, 'XL')).toBe(`${API}/images/proxy/42?size=XL`);
    });

    it('treats an empty filename as missing', () => {
      expect(getImageUrl({ document_id: 42, filename: '' }, 'SI')).toBe(`${API}/images/proxy/42?size=SI`);
    });

    describe('with a modern format', () => {
      it('returns undefined when modern thumbnails are disabled', () => {
        expect(getImageUrl(image, 'MI', 'webp')).toBeUndefined();
      });

      it('returns undefined for images older than modernThumbnailsId', () => {
        config.urls.modernThumbnailsId = 43;
        expect(getImageUrl(image, 'MI', 'webp')).toBeUndefined();
      });

      it('returns the proxy url with extension from modernThumbnailsId on', () => {
        config.urls.modernThumbnailsId = 42;
        expect(getImageUrl(image, 'MI', 'avif')).toBe(`${API}/images/proxy/42?size=MI&extension=avif`);
      });

      it('ignores format without size', () => {
        config.urls.modernThumbnailsId = 1;
        expect(getImageUrl(image, undefined, 'webp')).toBe(`${API}/images/proxy/42`);
      });
    });
  });
});

describe('getEmbeddedImageUrl', () => {
  const url = `${MEDIA}/1526229189_1504164474MI.jpg`;
  const urlProxy = '/images/proxy/42?size=MI';

  it('returns the direct media url', () => {
    expect(getEmbeddedImageUrl({ url, urlProxy })).toBe(url);
  });

  it.each(['avif', 'webp'])('returns the direct media url in %s', (format) => {
    expect(getEmbeddedImageUrl({ url, urlProxy }, format)).toBe(`${MEDIA}/1526229189_1504164474MI.${format}`);
  });

  it('replaces the extension of svg thumbnails', () => {
    expect(getEmbeddedImageUrl({ url: `${MEDIA}/1588000000_1MI.jpg`, urlProxy }, 'webp')).toBe(
      `${MEDIA}/1588000000_1MI.webp`
    );
  });

  it('falls back to the proxy when the media url is missing', () => {
    expect(getEmbeddedImageUrl({ urlProxy })).toBe(`${API}${urlProxy}`);
    expect(getEmbeddedImageUrl({ url: '', urlProxy })).toBe(`${API}${urlProxy}`);
    expect(getEmbeddedImageUrl({ urlProxy }, 'avif')).toBe(`${API}${urlProxy}&extension=avif`);
  });

  it.each([
    'https://evil.example.org/1526229189_1504164474MI.jpg',
    'https://media.example.org.evil.org/1526229189_1504164474MI.jpg',
    `${MEDIA}`,
    '//evil.example.org/x.jpg',
    'javascript:alert(1)',
  ])('falls back to the proxy for untrusted url %j', (untrusted) => {
    expect(getEmbeddedImageUrl({ url: untrusted, urlProxy })).toBe(`${API}${urlProxy}`);
    expect(getEmbeddedImageUrl({ url: untrusted, urlProxy }, 'webp')).toBe(`${API}${urlProxy}&extension=webp`);
  });

  it('falls back to the proxy when no media url is configured', () => {
    config.urls.media = '';
    expect(getEmbeddedImageUrl({ url: '/1526229189_1504164474MI.jpg', urlProxy })).toBe(`${API}${urlProxy}`);
  });

  it('falls back to the proxy for a format when the media url has no extension', () => {
    expect(getEmbeddedImageUrl({ url: `${MEDIA}/noextension`, urlProxy })).toBe(`${MEDIA}/noextension`);
    expect(getEmbeddedImageUrl({ url: `${MEDIA}/noextension`, urlProxy }, 'avif')).toBe(
      `${API}${urlProxy}&extension=avif`
    );
  });
});
