// This file exposes a simple function that upload a file to c2c image backend
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import Worker from '@/js/Worker';
import c2c from '@/js/apis/c2c';
import ol from '@/js/libs/ol';

dayjs.extend(customParseFormat);

// what this module reads of the image metadata (blueimp-load-image): its types have no getAll()
type MetadataTags = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAll(): Record<string, any>;
  get(tagName: string): unknown;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Tags = Record<string, any> | null;

// the image document being built from the file
type ImageDocument = Record<string, unknown>;

// get all world extent. sometimes, geoloc in exif is outside this extent.
const worldExtent = ol.proj.get('EPSG:4326')!.getExtent();

// this worker will handle network upload : only on upload at a time
const worker = new Worker();

// https://github.com/c2corg/v6_ui/blob/c9962a6c3bac0670eab732d563f9f480379f84d1/c2corg_ui/static/js/utils.js#L273
const convertDMSToDecimal = (degrees: string, minutes: string, seconds: string, direction?: string) => {
  let decimal = Number(degrees) + Number(minutes) / 60 + parseFloat(seconds) / 3600;

  // Don't do anything for N or E
  if (direction === 'S' || direction === 'W') {
    decimal = decimal * -1;
  }

  return decimal;
};

const parseDate = (exif: Tags, iptc: Tags) => {
  const iptcDate = iptc?.DateCreated;
  const exifDate = exif?.Exif?.DateTimeOriginal ?? exif?.DateTime;

  let date = undefined;

  if (iptcDate) {
    if (iptc?.TimeCreated) {
      date = dayjs(`${iptcDate} ${iptc.TimeCreated}`, 'YYYYMMDD hhmmssZZ');
    } else {
      date = dayjs(iptcDate, 'YYYYMMDD');
    }
  } else if (exifDate) {
    const offsetTime = exif?.Exif?.OffsetTimeOriginal ?? exif?.Exif?.OffsetTime;
    if (offsetTime) {
      date = dayjs(`${exifDate} ${offsetTime}`, 'YYYY:MM:DD HH:mm:ss Z');
    } else {
      date = dayjs(exifDate, 'YYYY:MM:DD HH:mm:ss');
    }
  }

  return date && date.isValid() ? date.format() : null;
};

const parseExifGeometry = (exif: Tags) => {
  if (!exif?.GPSInfo?.GPSLatitude || !exif?.GPSInfo?.GPSLongitude) {
    return undefined;
  }

  const latDMS = exif.GPSInfo.GPSLatitude.split(',');
  const lonDMS = exif.GPSInfo.GPSLongitude.split(',');

  const lat = convertDMSToDecimal(latDMS[0], latDMS[1], latDMS[2], exif.GPSInfo?.GPSLatitudeRef);
  const lon = convertDMSToDecimal(lonDMS[0], lonDMS[1], lonDMS[2], exif.GPSInfo?.GPSLongitudeRef);

  if (Number.isNaN(lat) || Number.isNaN(lon) || !ol.extent.containsXY(worldExtent, lon, lat)) {
    return undefined;
  }

  const location = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
  const geom = { coordinates: location, type: 'Point' };

  return { geom: JSON.stringify(geom) };
};

const parseExifElevation = (exif: Tags) => {
  if (!exif?.GPSInfo?.GPSAltitude) {
    return undefined;
  }

  const elevation = parseFloat(exif.GPSInfo.GPSAltitude);
  return isNaN(elevation) ? undefined : elevation;
};

const setIfDefined = (document: ImageDocument, name: string, value: unknown) => {
  if (value !== undefined) {
    document[name] = value;
  }
};

const readFile = async (file: Blob) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const extractDimensions = async (dataUrl: string) => {
  return new Promise<{ dataUrl: string; width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ dataUrl, width: img.width, height: img.height });
    img.src = dataUrl;
  });
};

// exported for the specs
export const parseMetaData = (document: ImageDocument, metaData: { exif?: unknown; iptc?: unknown }) => {
  const exifTags = metaData.exif as MetadataTags | undefined;
  const exif = exifTags?.getAll() ?? null;
  const iptc = (metaData.iptc as MetadataTags | undefined)?.getAll() ?? null;
  let orientation = 0;

  setIfDefined(document, 'date_time', parseDate(exif, iptc));

  if (exif) {
    orientation = exifTags!.get('Orientation') as number;

    setIfDefined(document, 'exposure_time', exif?.Exif?.ExposureTime);
    setIfDefined(document, 'iso_speed', exif?.Exif?.PhotographicSensitivity);
    setIfDefined(document, 'focal_length', exif?.Exif?.FocalLengthIn35mmFilm);
    setIfDefined(document, 'fnumber', exif?.Exif?.FNumber);
    setIfDefined(document, 'camera_name', exif?.Make && exif?.Model ? exif.Make + ' ' + exif.Model : undefined);
    setIfDefined(document, 'geometry', parseExifGeometry(exif));
    setIfDefined(document, 'elevation', parseExifElevation(exif));
  }
  return orientation;
};

const preProcess = async (
  file: File,
  document: ImageDocument,
  orientation: number | undefined,
  onDataUrlReady: (dataUrl: string) => void
): Promise<Blob> => {
  let options: Record<string, unknown> = {};
  // fix orientation
  if (orientation) {
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
    const { default: loadImage } = await import('blueimp-load-image');
    const { image } = await loadImage(file, options);
    const canvas = image as HTMLCanvasElement;
    onDataUrlReady(canvas.toDataURL(file.type)); // send data url to caller
    // and extract modified image for upload
    return new Promise((resolve) => {
      canvas.toBlob((file) => {
        document.file_size = file!.size;
        document.width = canvas.width;
        document.height = canvas.height;
        resolve(file as Blob);
      }, file.type);
    });
  } else {
    onDataUrlReady(dataUrl); // send data url to caller
    document.width = width;
    document.height = height;
    return Promise.resolve(file);
  }
};

const orientations = [1, 6, 3, 8];

// angle should be one of 0, 90, 180, 270 (in degrees)
const uploadFile = async (
  file: File,
  angle: number,
  onDataUrlReady: (dataUrl: string) => void,
  onUploadProgress: (event: unknown) => void,
  onSuccess: (document: ImageDocument) => void,
  onFailure: (error?: unknown) => void
) => {
  try {
    const document: ImageDocument = {};
    const { default: loadImage } = await import('blueimp-load-image');
    // the meta option (metadata only) is missing from the types of blueimp-load-image
    const metaData = (await loadImage(file, { meta: true } as unknown as Parameters<typeof loadImage>[1])) as {
      exif?: unknown;
      iptc?: unknown;
    };
    let orientation: number | undefined = await parseMetaData(document, metaData);
    if (angle) {
      // if no orientation has been retrieved, consider value 1 (no rotation)
      orientation = orientations[(orientations.indexOf(orientation || 1) + angle / 90) % 4];
    }
    const data = await preProcess(file, document, orientation, onDataUrlReady);
    // do the upload
    worker.push(
      c2c.uploadImage.bind(c2c),
      data,
      onUploadProgress,
      (event: { data: { filename: string } }) => {
        document.filename = event.data.filename;
        onSuccess(document);
      },
      onFailure
    );
  } catch {
    onFailure();
  }
};

export default uploadFile;
