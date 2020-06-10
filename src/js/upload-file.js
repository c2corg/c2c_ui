// This file exposes a simple function that upload a file to c2c image backend

import loadImage from 'blueimp-load-image';
import moment from 'moment';

import Worker from '@/js/Worker';
import c2c from '@/js/apis/c2c';
import ol from '@/js/libs/ol.js';

// get all world extent. sometimes, geoloc in exif is outside this extent.
const worldExtent = ol.proj.get('EPSG:4326').getExtent();

// this worker will handle network upload : only on upload at a time
const worker = new Worker();

// Microsoft Edge does not implement toblob, and there is no polyfill in core.js
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob#Polyfill
if (!HTMLCanvasElement.prototype.toBlob) {
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    value(callback, type, quality) {
      const dataURL = this.toDataURL(type, quality).split(',')[1];
      setTimeout(function () {
        const binStr = atob(dataURL);
        const len = binStr.length;
        const arr = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
          arr[i] = binStr.charCodeAt(i);
        }

        callback(new Blob([arr], { type: type || 'image/png' }));
      });
    },
  });
}

// https://github.com/c2corg/v6_ui/blob/c9962a6c3bac0670eab732d563f9f480379f84d1/c2corg_ui/static/js/utils.js#L273
const convertDMSToDecimal = function (degrees, minutes, seconds, direction) {
  let decimal = Number(degrees) + Number(minutes) / 60 + parseFloat(seconds) / 3600;

  // Don't do anything for N or E
  if (direction === 'S' || direction === 'W') {
    decimal = decimal * -1;
  }

  return decimal;
};

const parseDate = function (exif, iptc) {
  const iptcDate = iptc ? iptc.DateCreated : null;
  const exifDate = exif ? exif.DateTimeOriginal || exif.DateTime : null;

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

const parseExifGeometry = function (exif) {
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

const parseExifElevation = function (exif) {
  if (!exif.GPSAltitude) {
    return undefined;
  }

  const elevation = parseFloat(exif.GPSAltitude);
  return isNaN(elevation) ? undefined : elevation;
};

const setIfDefined = function (document, name, value) {
  if (value !== undefined) {
    document[name] = value;
  }
};

const uploadFile = function (file, onDataUrlReady, onUploadProgress, onSuccess, onFailure) {
  const document = {};

  const parseMetaData = function (metaData) {
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
    preProcess(orientation);
  };

  const preProcess = function (orientation) {
    if (orientation !== 0 && file.type === 'image/jpeg') {
      loadImage(
        file,
        (canvas) => {
          processDataUrl(canvas.toDataURL(file.type));

          // and this function will call upload
          canvas.toBlob(upload, file.type);
        },
        { canvas: true, orientation } // this will fix orientation from exif
      );
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        processDataUrl(e.target.result);
      };
      reader.readAsDataURL(file);

      upload(file);
    }
  };

  const processDataUrl = function (dataUrl) {
    // send data url to caller
    onDataUrlReady(dataUrl);

    // and use this to get image dimensions
    const img = new Image();

    img.onload = function () {
      // image is loaded; sizes are available
      document.width = img.width;
      document.height = img.height;
    };

    img.src = dataUrl;
  };

  const onUploadSuccess = function (event) {
    document.filename = event.data.filename;
    onSuccess(document);
  };

  const upload = function (data) {
    worker.push(c2c.uploadImage.bind(c2c), data, onUploadProgress, onUploadSuccess, onFailure);
  };

  loadImage.parseMetaData(file, parseMetaData);
};
export default uploadFile;
