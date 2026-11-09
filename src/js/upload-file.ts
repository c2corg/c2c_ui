// This file exposes a simple function that upload a file to c2c image backend
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { containsXY } from 'ol/extent';
import { get as getProjection, transform } from 'ol/proj';

import Worker from '@/js/Worker';
import c2c from '@/js/apis/c2c';

dayjs.extend(customParseFormat);

// the metadata of the file as exifr gives them: EXIF, GPS and IPTC tags in one object, values as stored
export type Metadata = Record<string, unknown>;

// the image document being built from the file
type ImageDocument = Record<string, unknown>;

// get all world extent. sometimes, geoloc in exif is outside this extent.
const worldExtent = getProjection('EPSG:4326')!.getExtent();

// this worker will handle network upload : only on upload at a time
const worker = new Worker();

// Limits of the stored originals (c2corg/c2c_images#1205). The site shows 1500 px at most (BI thumbnail): a long side
// of 3072 px allows a 2x thumbnail. Panoramas keep 2048 px on their short side, up to 16 megapixels (Safari limits a
// canvas to 16.7 megapixels).
const MAX_LONG_SIDE = 3072;
const PANORAMA_RATIO = 2;
const MAX_PANORAMA_SHORT_SIDE = 2048;
const MAX_PANORAMA_PIXELS = 16_000_000;
// SSIMULACRA2 over 80 ("high") on photos, and less storage than the 0.92 of the browsers on 2048 px (#1205)
const JPEG_QUALITY = 0.9;

const string = (value: unknown) => (typeof value === 'string' ? value : undefined);
const number = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

const parseDate = (tags: Metadata) => {
  const iptcDate = string(tags.DateCreated);
  const exifDate = string(tags.DateTimeOriginal) ?? string(tags.DateTime);

  let date = undefined;

  if (iptcDate) {
    const iptcTime = string(tags.TimeCreated);
    if (iptcTime) {
      // with or without its offset
      date = dayjs(`${iptcDate} ${iptcTime}`, ['YYYYMMDD HHmmssZZ', 'YYYYMMDD HHmmss']);
    } else {
      date = dayjs(iptcDate, 'YYYYMMDD');
    }
  } else if (exifDate) {
    const offsetTime = string(tags.OffsetTimeOriginal) ?? string(tags.OffsetTime);
    if (offsetTime) {
      date = dayjs(`${exifDate} ${offsetTime}`, 'YYYY:MM:DD HH:mm:ss Z');
    } else {
      date = dayjs(exifDate, 'YYYY:MM:DD HH:mm:ss');
    }
  }

  return date && date.isValid() ? date.format() : null;
};

const parseGeometry = (tags: Metadata) => {
  // signed decimal degrees, computed by exifr from the GPS tags
  const lat = number(tags.latitude);
  const lon = number(tags.longitude);

  if (lat === undefined || lon === undefined || !containsXY(worldExtent, lon, lat)) {
    return undefined;
  }

  const location = transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
  const geom = { coordinates: location, type: 'Point' };

  return { geom: JSON.stringify(geom) };
};

const setIfDefined = (document: ImageDocument, name: string, value: unknown) => {
  if (value !== undefined) {
    document[name] = value;
  }
};

// exported for the specs
export const parseMetaData = (document: ImageDocument, tags: Metadata | undefined) => {
  if (!tags) {
    return;
  }

  setIfDefined(document, 'date_time', parseDate(tags));
  setIfDefined(document, 'exposure_time', number(tags.ExposureTime));
  setIfDefined(document, 'iso_speed', number(tags.ISO));
  setIfDefined(document, 'focal_length', number(tags.FocalLengthIn35mmFormat));
  setIfDefined(document, 'fnumber', number(tags.FNumber));
  const make = string(tags.Make);
  const model = string(tags.Model);
  setIfDefined(document, 'camera_name', make && model ? `${make} ${model}` : undefined);
  setIfDefined(document, 'geometry', parseGeometry(tags));
  setIfDefined(document, 'elevation', number(tags.GPSAltitude));
};

// the metadata of JPEG, HEIC, PNG, TIFF...: none when the file has none or cannot be read
const readMetadata = async (file: Blob): Promise<Metadata | undefined> => {
  try {
    const { default: exifr } = await import('exifr');
    return (await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      iptc: true,
      ifd1: false,
      interop: false,
      // numbers and strings as stored: dates are read with their offset above
      translateValues: false,
      reviveValues: false,
    })) as Metadata | undefined;
  } catch {
    return undefined;
  }
};

// The image decoded by the browser, upright (the browsers apply the EXIF orientation since 2020), or none: HEIC in
// Chrome and Firefox, a broken file... Its src is an object URL of the file, for the preview.
const decodeImage = (file: Blob) =>
  new Promise<HTMLImageElement | undefined>((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    img.src = url;
  });

// The size to store an image at, or undefined to keep it (exported for the specs)
export const storedSize = (width: number, height: number) => {
  const longSide = Math.max(width, height);
  const shortSide = Math.min(width, height);
  const scale =
    longSide / shortSide > PANORAMA_RATIO
      ? Math.min(MAX_PANORAMA_SHORT_SIDE / shortSide, Math.sqrt(MAX_PANORAMA_PIXELS / (width * height)))
      : MAX_LONG_SIDE / longSide;
  // rounded down, to stay under the limits (the epsilon against the errors of floating point)
  const reduce = (side: number) => Math.floor(side * scale + 1e-6);
  return scale < 1 ? { width: reduce(width), height: reduce(height) } : undefined;
};

// draws the image at that size, turned clockwise by angle, and encodes it
const render = (img: HTMLImageElement, width: number, height: number, angle: number, type: string) => {
  const turned = angle % 180 !== 0;
  const canvas = document.createElement('canvas');
  canvas.width = turned ? height : width;
  canvas.height = turned ? width : height;
  const context = canvas.getContext('2d')!;
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((angle * Math.PI) / 180);
  context.drawImage(img, -width / 2, -height / 2, width, height);
  return new Promise<{ blob: Blob; width: number; height: number }>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve({ blob, width: canvas.width, height: canvas.height }) : reject(new Error('toBlob'))),
      type,
      JPEG_QUALITY
    );
  });
};

// Sends the file as it is (with its EXIF and colour profile) unless it is over the limits or turned by the user: then
// reduced and re-encoded, as JPEG (PNG stays PNG). SVG and GIF (animations) are sent as they are. A file the browser
// cannot decode (HEIC in Chrome and Firefox) is sent as it is, without preview: the server converts HEIC to JPEG.
const preProcess = async (
  file: File,
  document: ImageDocument,
  tags: Metadata | undefined,
  angle: number,
  onDataUrlReady: (dataUrl: string | null) => void
): Promise<Blob> => {
  const img = await decodeImage(file);

  if (!img) {
    onDataUrlReady(null);
    // the size before the EXIF orientation: turned for orientations 5 to 8
    const width = number(tags?.ExifImageWidth);
    const height = number(tags?.ExifImageHeight);
    const orientation = number(tags?.Orientation) ?? 1;
    if (width && height) {
      document.width = orientation >= 5 ? height : width;
      document.height = orientation >= 5 ? width : height;
    }
    return file;
  }

  const { naturalWidth: width, naturalHeight: height } = img;
  const kept = file.type === 'image/svg+xml' || file.type === 'image/gif';
  const size = kept ? undefined : storedSize(width, height);

  if (kept || (!size && !angle)) {
    onDataUrlReady(img.src);
    document.width = width;
    document.height = height;
    return file;
  }

  const rendered = await render(
    img,
    size?.width ?? width,
    size?.height ?? height,
    angle,
    file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  );
  URL.revokeObjectURL(img.src);
  onDataUrlReady(URL.createObjectURL(rendered.blob));
  document.file_size = rendered.blob.size;
  document.width = rendered.width;
  document.height = rendered.height;
  return rendered.blob;
};

// angle should be one of 0, 90, 180, 270 (in degrees, clockwise)
const uploadFile = async (
  file: File,
  angle: number,
  onDataUrlReady: (dataUrl: string | null) => void,
  onUploadProgress: (event: unknown) => void,
  onSuccess: (document: ImageDocument) => void,
  onFailure: (error?: unknown) => void
) => {
  try {
    const document: ImageDocument = {};
    const tags = await readMetadata(file);
    parseMetaData(document, tags);
    const data = await preProcess(file, document, tags, angle || 0, onDataUrlReady);
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
