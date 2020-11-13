// This file exposes a simple function that upload a file to c2c image backend

import loadImage from 'blueimp-load-image';
import moment from 'moment';

import Worker from '@/js/Worker';
import c2c from '@/js/apis/c2c';
import ol from '@/js/libs/ol';

// get all world extent. sometimes, geoloc in exif is outside this extent.
const worldExtent = ol.proj.get('EPSG:4326').getExtent();

// this worker will handle network upload : only on upload at a time
const worker = new Worker();

// https://github.com/c2corg/v6_ui/blob/c9962a6c3bac0670eab732d563f9f480379f84d1/c2corg_ui/static/js/utils.js#L273
const convertDMSToDecimal = (degrees, minutes, seconds, direction) => {
  let decimal = Number(degrees) + Number(minutes) / 60 + parseFloat(seconds) / 3600;

  // Don't do anything for N or E
  if (direction === 'S' || direction === 'W') {
    decimal = decimal * -1;
  }

  return decimal;
};

const parseDate = (exif, iptc) => {
  const iptcDate = iptc ? iptc.DateCreated : null;
  const exifDate = exif ? exif.DateTimeOriginal ?? exif.DateTime : null;

  let date = null;

  if (iptcDate) {
    if (iptc.TimeCreated) {
      date = moment(`${iptcDate} ${iptc.TimeCreated}`, 'YYYYMMDD HHmmssZ ZZ');
    } else {
      date = moment(iptcDate, 'YYYYMMDD');
    }
  } else if (exifDate) {
    date = moment(exifDate, 'YYYY:MM:DD HH:mm:ss');
  }

  return date && date.isValid() ? date.format() : null;
};

const parseExifGeometry = (exif) => {
  if (!exif.GPSLatitude || !exif.GPSLongitude) {
    return undefined;
  }

  let lat = exif.GPSLatitude.split(',');
  let lon = exif.GPSLongitude.split(',');

  lat = convertDMSToDecimal(lat[0], lat[1], lat[2], exif.GPSLatitudeRef);
  lon = convertDMSToDecimal(lon[0], lon[1], lon[2], exif.GPSLongitudeRef);

  if (isNaN(lat) || isNaN(lon) || !ol.extent.containsXY(worldExtent, lon, lat)) {
    return undefined;
  }

  const location = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
  const geom = { coordinates: location, type: 'Point' };

  return { geom: JSON.stringify(geom) };
};

const parseExifElevation = (exif) => {
  if (!exif.GPSAltitude) {
    return undefined;
  }

  const elevation = parseFloat(exif.GPSAltitude);
  return isNaN(elevation) ? undefined : elevation;
};

const setIfDefined = (document, name, value) => {
  if (value !== undefined) {
    document[name] = value;
  }
};

const readFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const extractDimensions = async (dataUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ dataUrl, width: img.width, height: img.height });
    img.src = dataUrl;
  });
};

const parseMetaData = (document, metaData) => {
  const exif = metaData.exif ? metaData.exif.getAll() : null;
  const iptc = metaData.iptc ? metaData.iptc.getAll() : null;
  let orientation = 0;

  setIfDefined(document, 'date_time', parseDate(exif, iptc));

  if (exif) {
    orientation = metaData.exif.get('Orientation');

    setIfDefined(document, 'exposure_time', exif.ExposureTime);
    setIfDefined(document, 'iso_speed', exif.PhotographicSensitivity);
    setIfDefined(document, 'focal_length', exif.FocalLengthIn35mmFilm);
    setIfDefined(document, 'fnumber', exif.FNumber);
    setIfDefined(document, 'camera_name', exif.Make && exif.Model ? exif.Make + ' ' + exif.Model : undefined);
    setIfDefined(document, 'geometry', parseExifGeometry(exif));
    setIfDefined(document, 'elevation', parseExifElevation(exif));
  }
  return orientation;
};

const preProcess = async (file, document, orientation, onDataUrlReady) => {
  let options = {};
  // fix orientation for JPEGs, based on EXIF
  if (file.type === 'image/jpeg' && orientation) {
    options = { ...options, orientation };
  }

  const result = await readFile(file);
  // limit file size and dimensions
  const { dataUrl, width, height } = await extractDimensions(result);

  // no restriction on SVGs.
  // images weighting over 2MB are restricted to 2048px height (thus allowing panos).
  // this is a simple heuristic with flaws, but should match most cases
  if (file.type !== 'image/svg+xml' && file.size > 2 * 1024 * 1024 && height > 2048) {
    options = { ...options, maxHeight: 2048 };
  }

  if (Object.keys(options).length) {
    options = { ...options, canvas: true };
    const { image: canvas } = await loadImage(file, options);
    onDataUrlReady(canvas.toDataURL(file.type)); // send data url to caller
    // and extract modified image for upload
    return new Promise((resolve) => {
      canvas.toBlob((file) => {
        document.file_size = file.size;
        document.width = canvas.width;
        document.height = canvas.height;
        resolve(file);
      }, file.type);
    });
  } else {
    onDataUrlReady(dataUrl); // send data url to caller
    document.width = width;
    document.height = height;
    return Promise.resolve(file);
  }
};

const uploadFile = async (file, onDataUrlReady, onUploadProgress, onSuccess, onFailure) => {
  try {
    const document = {};
    const metaData = await loadImage.parseMetaData(file);
    const orientation = await parseMetaData(document, metaData);
    const data = await preProcess(file, document, orientation, onDataUrlReady);
    // do the upload
    worker.push(
      c2c.uploadImage.bind(c2c),
      data,
      onUploadProgress,
      (event) => {
        document.filename = event.data.filename;
        onSuccess(document);
      },
      onFailure
    );
  } catch (error) {
    onFailure();
  }
};

export default uploadFile;
