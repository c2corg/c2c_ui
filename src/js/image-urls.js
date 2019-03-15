import config from '@/js/config';

const getUrl = function(image, size) {
  if (!image.filename) {
    const sizeArg = size ? `?$size=${size}` : '';
    return `${config.urls.api}/images/proxy/${image.document_id}${sizeArg}`;
  }

  let backendFilename;

  if (size) {
    backendFilename = image.filename.replace('.', `${size}.`).replace('.svg', '.jpg');
  } else {
    backendFilename = image.filename;
  }

  return `${config.urls.media}/${backendFilename}`;
};

export default {
  /* 200*200 px images */
  getSquared(image) {
    return getUrl(image, 'SI');
  },

  // max 400*400
  getMedium(image) {
    return getUrl(image, 'MI');
  },

  //
  getBig(image) {
    return getUrl(image, 'BI');
  },

  /* Original size */
  get(image) {
    return getUrl(image);
  }
};
