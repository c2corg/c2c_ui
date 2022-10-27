import config from '@/js/config';

const getImageProxyUrl = function (image, size, format) {
  // Until all images are migrated only images uploaded after a given timestamp
  // or with an id greater than a given one have their webp and avif versions
  if (format && (!config.urls.modernThumbnailsId || image.document_id < config.urls.modernThumbnailsId)) {
    return;
  }

  const sizeArg = size ? `?size=${size}` : '';
  const formatArg = format && size ? `&extension=${format}` : '';
  return `${config.urls.api}/images/proxy/${image.document_id}${sizeArg}${formatArg}`;
};

export const getImageUrl = function (image, size, format) {
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
      // or with an id greater than a given one have their webp and avif versions
      const timestamp = Number.parseInt(image.filename.split('_')[0], 10);
      if (!config.urls.modernThumbnailsTimestamp || timestamp < config.urls.modernThumbnailsTimestamp) {
        return;
      }
      return backendFilename.substring(0, backendFilename.length - 3) + format;
    }
  } else {
    backendFilename = image.filename;
  }

  return `${config.urls.media}/${backendFilename}`;
};
