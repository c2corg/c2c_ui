import config from '@/js/config';

// the image documents of the API, with what the URLs need
export type Image = { document_id: number; filename?: string };

export type ImageSize = 'SI' | 'MI' | 'BI';

// the box each thumbnail fits in, without enlarging the original (v6_images: convert -resize 1500x1500>, 400x400>)
const THUMBNAIL_BOXES: Partial<Record<ImageSize, number>> = { BI: 1500, MI: 400 };

/** The size of a BI or MI thumbnail, from the size of the original image (image documents), if known */
export const getThumbnailSize = function (
  image: { width?: number | null; height?: number | null },
  size: ImageSize
): { width: number; height: number } | undefined {
  const box = THUMBNAIL_BOXES[size];
  if (!box || !image.width || !image.height) {
    return undefined;
  }
  const scale = Math.min(1, box / Math.max(image.width, image.height));
  return { width: Math.round(image.width * scale), height: Math.round(image.height * scale) };
};

// AVIF only: the thumbnails have no WebP version (c2corg/c2c_images#1160)
export type ImageFormat = 'avif';

const getImageProxyUrl = function (image: Image, size?: ImageSize, format?: ImageFormat): string | undefined {
  // Until all images are migrated only images uploaded after a given timestamp
  // or with an id greater than a given one have their AVIF versions
  if (format && (!config.urls.modernThumbnailsId || image.document_id < config.urls.modernThumbnailsId)) {
    return;
  }

  const sizeArg = size ? `?size=${size}` : '';
  const formatArg = format && size ? `&extension=${format}` : '';
  return `${config.urls.api}/images/proxy/${image.document_id}${sizeArg}${formatArg}`;
};

export const getImageUrl = function (image: Image, size?: ImageSize, format?: ImageFormat): string | undefined {
  if (!image.filename) {
    return getImageProxyUrl(image, size, format);
  }

  let backendFilename;

  if (size) {
    if (!['SI', 'MI', 'BI'].includes(size)) {
      throw new Error('Invalid size');
    }

    backendFilename = image.filename.replace('.', `${size}.`).replace('.svg', '.jpg');
    if (format) {
      // Until all images are migrated only images uploaded after a given timestamp
      // or with an id greater than a given one have their AVIF versions
      const timestamp = Number.parseInt(image.filename.split('_')[0], 10);
      if (
        !config.urls.modernThumbnailsTimestamp ||
        Number.isNaN(timestamp) ||
        timestamp < config.urls.modernThumbnailsTimestamp
      ) {
        return;
      }
      return `${config.urls.media}/${backendFilename.substring(0, backendFilename.length - 3) + format}`;
    }
  } else {
    backendFilename = image.filename;
  }

  return `${config.urls.media}/${backendFilename}`;
};

/**
 * URL of an image embedded in rich content ([img=ID] tag cooked by the API), optionally in a modern format.
 *
 * `url` (c2c:url) is the direct media server URL, the one the API image proxy redirects to. It is used when it points
 * to our media server, so that documents embedding hundreds of images do not send hundreds of requests to the API.
 * Otherwise (older API, or another media host), the API image proxy `urlProxy` (c2c:url-proxy) is used.
 */
export const getEmbeddedImageUrl = function (
  { url, urlProxy }: { url?: string | null; urlProxy: string },
  format?: ImageFormat
): string {
  if (url && config.urls.media && url.startsWith(`${config.urls.media}/`)) {
    if (!format) {
      return url;
    }
    // same as the proxy for ?size=...&extension=...: thumbnail filename with the format as extension
    const extension = /\.[a-z0-9]+$/i;
    if (extension.test(url)) {
      return url.replace(extension, `.${format}`);
    }
  }

  return config.urls.api + urlProxy + (format ? `&extension=${format}` : '');
};
