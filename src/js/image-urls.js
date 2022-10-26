import config from '@/js/config';

export const getImageUrl = function (image, size, format) {
  if (!image.filename) {
    const sizeArg = size ? `?size=${size}` : '';
    return `${config.urls.api}/images/proxy/${image.document_id}${sizeArg}`;
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
