import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type ImageSize,
  fallBackToBasicImage,
  getEmbeddedImageUrl,
  getImageUrl,
  getResponsiveSrcset,
  getThumbnailSize,
} from './image-urls';

// '@/js/config' reads CAMPTOCAMP_CONFIG, a constant injected by Vite (see vite.config.mjs)
const config = vi.hoisted(() => ({
  urls: {} as { api: string; media: string; modernThumbnailsTimestamp: number; modernThumbnailsId: number },
}));
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

    it.each(['SI', 'MI', 'BI'] as const)('returns the %s thumbnail', (size) => {
      expect(getImageUrl(image, size)).toBe(`${MEDIA}/1588000000_123456${size}.jpg`);
    });

    it.each(['XL', 'si', 'small'])('throws on invalid size %j', (size) => {
      expect(() => getImageUrl(image, size as ImageSize)).toThrow('Invalid size');
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
      expect(getImageUrl(image, undefined, 'avif')).toBe(`${MEDIA}/1588000000_123456.jpg`);
    });

    describe('with a modern format', () => {
      it('returns undefined when modern thumbnails are disabled', () => {
        expect(getImageUrl(image, 'MI', 'avif')).toBeUndefined();
      });

      it('returns undefined for images older than modernThumbnailsTimestamp', () => {
        config.urls.modernThumbnailsTimestamp = 1588000001;
        expect(getImageUrl(image, 'MI', 'avif')).toBeUndefined();
      });

      it.each(['avif'] as const)('returns the %s thumbnail from modernThumbnailsTimestamp on', (format) => {
        config.urls.modernThumbnailsTimestamp = 1588000000;
        expect(getImageUrl(image, 'MI', format)).toBe(`${MEDIA}/1588000000_123456MI.${format}`);
        expect(getImageUrl({ document_id: 1, filename: '1700000000_1.png' }, 'BI', format)).toBe(
          `${MEDIA}/1700000000_1BI.${format}`
        );
      });

      it('replaces the jpg extension of svg thumbnails', () => {
        config.urls.modernThumbnailsTimestamp = 1;
        expect(getImageUrl({ document_id: 1, filename: '1588000000_1.svg' }, 'SI', 'avif')).toBe(
          `${MEDIA}/1588000000_1SI.avif`
        );
      });

      it('returns undefined when the filename has no numeric timestamp', () => {
        config.urls.modernThumbnailsTimestamp = 1;
        expect(getImageUrl({ document_id: 1, filename: 'abc.jpg' }, 'SI', 'avif')).toBeUndefined();
      });

      it('returns undefined for a just uploaded image, whose AVIF thumbnails may not be built yet', () => {
        config.urls.modernThumbnailsTimestamp = 1;
        const uploaded = { ...image, modernThumbnailsPending: true };
        expect(getImageUrl(uploaded, 'BI', 'avif')).toBeUndefined();
        expect(getImageUrl(uploaded, 'BI')).toBe(`${MEDIA}/1588000000_123456BI.jpg`);
        expect(getImageUrl(uploaded)).toBe(`${MEDIA}/1588000000_123456.jpg`);
      });

      it('validates the size before the format', () => {
        expect(() => getImageUrl(image, 'XL' as ImageSize, 'avif')).toThrow('Invalid size');
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
      expect(getImageUrl(image, 'XL' as ImageSize)).toBe(`${API}/images/proxy/42?size=XL`);
    });

    it('treats an empty filename as missing', () => {
      expect(getImageUrl({ document_id: 42, filename: '' }, 'SI')).toBe(`${API}/images/proxy/42?size=SI`);
    });

    describe('with a modern format', () => {
      it('returns undefined when modern thumbnails are disabled', () => {
        expect(getImageUrl(image, 'MI', 'avif')).toBeUndefined();
      });

      it('returns undefined for images older than modernThumbnailsId', () => {
        config.urls.modernThumbnailsId = 43;
        expect(getImageUrl(image, 'MI', 'avif')).toBeUndefined();
      });

      it('returns the proxy url with extension from modernThumbnailsId on', () => {
        config.urls.modernThumbnailsId = 42;
        expect(getImageUrl(image, 'MI', 'avif')).toBe(`${API}/images/proxy/42?size=MI&extension=avif`);
      });

      it('returns undefined for a just uploaded image', () => {
        config.urls.modernThumbnailsId = 1;
        const uploaded = { ...image, modernThumbnailsPending: true };
        expect(getImageUrl(uploaded, 'MI', 'avif')).toBeUndefined();
        expect(getImageUrl(uploaded, 'MI')).toBe(`${API}/images/proxy/42?size=MI`);
      });

      it('ignores format without size', () => {
        config.urls.modernThumbnailsId = 1;
        expect(getImageUrl(image, undefined, 'avif')).toBe(`${API}/images/proxy/42`);
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

  it.each(['avif'] as const)('returns the direct media url in %s', (format) => {
    expect(getEmbeddedImageUrl({ url, urlProxy }, format)).toBe(`${MEDIA}/1526229189_1504164474MI.${format}`);
  });

  it('replaces the extension of svg thumbnails', () => {
    expect(getEmbeddedImageUrl({ url: `${MEDIA}/1588000000_1MI.jpg`, urlProxy }, 'avif')).toBe(
      `${MEDIA}/1588000000_1MI.avif`
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
    expect(getEmbeddedImageUrl({ url: untrusted, urlProxy }, 'avif')).toBe(`${API}${urlProxy}&extension=avif`);
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

describe('fallBackToBasicImage', () => {
  const picture = () => {
    const element = document.createElement('picture');
    element.innerHTML = `<source type="image/avif" srcset="${MEDIA}/1MI.avif" /><img src="${MEDIA}/1MI.jpg" />`;
    return { source: element.querySelector('source')!, img: element.querySelector('img')! };
  };

  it('shows the basic image instead of the modern one', () => {
    const { source, img } = picture();
    expect(fallBackToBasicImage(img)).toBe(true);
    expect(source.srcset).toBe(`${MEDIA}/1MI.jpg`);
  });

  it('does nothing when the basic image fails too, so that it is not loaded again endlessly', () => {
    const { source, img } = picture();
    fallBackToBasicImage(img);
    const setAttribute = vi.spyOn(source, 'setAttribute');
    expect(fallBackToBasicImage(img)).toBe(false);
    expect(source.srcset).toBe(`${MEDIA}/1MI.jpg`);
    expect(setAttribute).not.toHaveBeenCalled();
  });

  it('offers the basic thumbnails of a responsive image', () => {
    const element = document.createElement('picture');
    element.innerHTML =
      `<source type="image/avif" srcset="${MEDIA}/1MI.avif 400w, ${MEDIA}/1BI.avif 1500w" />` +
      `<img src="${MEDIA}/1MI.jpg" srcset="${MEDIA}/1MI.jpg 400w, ${MEDIA}/1BI.jpg 1500w" />`;
    expect(fallBackToBasicImage(element.querySelector('img')!)).toBe(true);
    expect(element.querySelector('source')!.srcset).toBe(`${MEDIA}/1MI.jpg 400w, ${MEDIA}/1BI.jpg 1500w`);
  });

  it('does nothing for an image outside a picture', () => {
    const img = document.createElement('img');
    document.createElement('div').appendChild(img);
    expect(fallBackToBasicImage(img)).toBe(false);
    expect(fallBackToBasicImage(document.createElement('img'))).toBe(false);
  });
});

// v6_images: BI fits in 1500x1500 and MI in 400x400, never enlarged (checked against 30 production images)
describe('getThumbnailSize', () => {
  it('fits the original in the box of the thumbnail', () => {
    expect(getThumbnailSize({ width: 4000, height: 3000 }, 'BI')).toEqual({ width: 1500, height: 1125 });
    expect(getThumbnailSize({ width: 909, height: 1611 }, 'BI')).toEqual({ width: 846, height: 1500 });
    expect(getThumbnailSize({ width: 4000, height: 3000 }, 'MI')).toEqual({ width: 400, height: 300 });
  });

  it('does not enlarge a smaller original', () => {
    expect(getThumbnailSize({ width: 800, height: 600 }, 'BI')).toEqual({ width: 800, height: 600 });
  });

  it('gives nothing without the size of the original, or for SI (cropped)', () => {
    expect(getThumbnailSize({ width: null, height: 600 }, 'BI')).toBeUndefined();
    expect(getThumbnailSize({}, 'MI')).toBeUndefined();
    expect(getThumbnailSize({ width: 800, height: 600 }, 'SI')).toBeUndefined();
  });
});

describe('getResponsiveSrcset', () => {
  const image = { document_id: 42, filename: '1588000000_123456.jpg', width: 4000, height: 3000 };

  it('offers the thumbnail and BI, with their widths', () => {
    expect(getResponsiveSrcset(image, 'MI')).toBe(
      `${MEDIA}/1588000000_123456MI.jpg 400w, ${MEDIA}/1588000000_123456BI.jpg 1500w`
    );
    expect(getResponsiveSrcset({ ...image, width: 909, height: 1611 }, 'MI')).toBe(
      `${MEDIA}/1588000000_123456MI.jpg 226w, ${MEDIA}/1588000000_123456BI.jpg 846w`
    );
  });

  it('offers the AVIF thumbnails, when they exist', () => {
    config.urls.modernThumbnailsTimestamp = 1;
    expect(getResponsiveSrcset(image, 'MI', 'avif')).toBe(
      `${MEDIA}/1588000000_123456MI.avif 400w, ${MEDIA}/1588000000_123456BI.avif 1500w`
    );
    expect(getResponsiveSrcset({ ...image, modernThumbnailsPending: true }, 'MI', 'avif')).toBeUndefined();
  });

  it('takes the box width without the size of the original', () => {
    expect(getResponsiveSrcset({ document_id: 42, filename: '1588000000_123456.jpg' }, 'MI')).toBe(
      `${MEDIA}/1588000000_123456MI.jpg 400w, ${MEDIA}/1588000000_123456BI.jpg 1500w`
    );
  });

  it('offers one candidate per width, for a small original', () => {
    expect(getResponsiveSrcset({ ...image, width: 300, height: 200 }, 'MI')).toBe(
      `${MEDIA}/1588000000_123456MI.jpg 300w`
    );
  });

  it('gives nothing for SI, whose width is unknown (cropped)', () => {
    expect(getResponsiveSrcset(image, 'SI')).toBeUndefined();
  });
});
