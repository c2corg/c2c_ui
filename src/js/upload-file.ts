// This file exposes a simple function that upload a file to c2c image backend
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import type { ExpandedTags } from 'exifreader';
import { containsXY } from 'ol/extent';
import { get as getProjection, transform } from 'ol/proj';

import Worker from '@/js/Worker';
import c2c from '@/js/apis/c2c';

dayjs.extend(customParseFormat);

// The metadata of the file used for the image document, read by ExifReader from its EXIF, IPTC and GPS tags
export type Metadata = {
  // the time of the shot, ISO 8601 or EXIF ('YYYY:MM:DD HH:mm:ss'), with its offset ('+01:00') or not
  date?: string;
  offset?: string;
  exposureTime?: number;
  iso?: number;
  focalLength?: number;
  fnumber?: number;
  make?: string;
  model?: string;
  // signed decimal degrees, meters
  latitude?: number;
  longitude?: number;
  altitude?: number;
  // as stored, before the orientation
  width?: number;
  height?: number;
  orientation?: number;
};

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

const parseDate = ({ date, offset }: Metadata) => {
  if (!date) {
    return null;
  }
  const parsed = date.includes('T')
    ? dayjs(date) // IPTC, with its offset or not
    : offset
      ? dayjs(`${date} ${offset}`, 'YYYY:MM:DD HH:mm:ss Z')
      : dayjs(date, 'YYYY:MM:DD HH:mm:ss');
  return parsed.isValid() ? parsed.format() : null;
};

const parseGeometry = ({ latitude: lat, longitude: lon }: Metadata) => {
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
export const parseMetaData = (document: ImageDocument, metadata: Metadata | undefined) => {
  if (!metadata) {
    return;
  }

  setIfDefined(document, 'date_time', parseDate(metadata));
  setIfDefined(document, 'exposure_time', metadata.exposureTime);
  setIfDefined(document, 'iso_speed', metadata.iso);
  setIfDefined(document, 'focal_length', metadata.focalLength);
  setIfDefined(document, 'fnumber', metadata.fnumber);
  const { make, model } = metadata;
  setIfDefined(document, 'camera_name', make && model ? `${make} ${model}` : undefined);
  setIfDefined(document, 'geometry', parseGeometry(metadata));
  setIfDefined(document, 'elevation', metadata.altitude);
};

type Tag = { value?: unknown; description?: string } | undefined;

const text = (tag: Tag) => tag?.description?.trim() || undefined;
const finite = (value: number) => (Number.isFinite(value) ? value : undefined);
// a number, or a rational: [numerator, denominator]
const number = (tag: Tag) => {
  const value = Array.isArray(tag?.value) && tag.value.length === 1 ? tag.value[0] : tag?.value;
  if (typeof value === 'number') {
    return finite(value);
  }
  if (Array.isArray(value) && value.length === 2 && value.every((part) => typeof part === 'number')) {
    return finite(value[0] / value[1]);
  }
  return undefined;
};

// The metadata of the tags of ExifReader (exported for the specs)
export const toMetadata = (tags: ExpandedTags): Metadata => {
  const { exif = {}, iptc = {}, gps, file = {} } = tags;
  const iptcDate = text(iptc['Date Created']);
  const iptcTime = text(iptc['Time Created']);
  return {
    // IPTC first, as edited by the photographers
    date: iptcDate ? `${iptcDate}T${iptcTime ?? '00:00:00'}` : (text(exif.DateTimeOriginal) ?? text(exif.DateTime)),
    offset: iptcDate ? undefined : (text(exif.OffsetTimeOriginal) ?? text(exif.OffsetTime)),
    exposureTime: number(exif.ExposureTime),
    iso: number(exif.ISOSpeedRatings),
    focalLength: number(exif.FocalLengthIn35mmFilm),
    fnumber: number(exif.FNumber),
    make: text(exif.Make),
    model: text(exif.Model),
    latitude: gps?.Latitude,
    longitude: gps?.Longitude,
    altitude: gps?.Altitude,
    width: number(exif.PixelXDimension) ?? number(file['Image Width']),
    height: number(exif.PixelYDimension) ?? number(file['Image Height']),
    orientation: number(exif.Orientation),
  };
};

// the metadata of JPEG, HEIC, PNG, WebP...: none when the file cannot be read
const readMetadata = async (file: File): Promise<Metadata | undefined> => {
  try {
    const { default: ExifReader } = await import('exifreader');
    return toMetadata(await ExifReader.load(file, { expanded: true }));
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
  metadata: Metadata | undefined,
  angle: number,
  onDataUrlReady: (dataUrl: string | null) => void
): Promise<Blob> => {
  const img = await decodeImage(file);

  if (!img) {
    onDataUrlReady(null);
    // the size before the EXIF orientation: turned for orientations 5 to 8. The server gives the size it stores.
    const { width, height, orientation = 1 } = metadata ?? {};
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

  let rendered;
  try {
    rendered = await render(
      img,
      size?.width ?? width,
      size?.height ?? height,
      angle,
      file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    );
  } finally {
    // the decoded file is not the preview: freed, also when the rendering fails
    URL.revokeObjectURL(img.src);
  }
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
    const metadata = await readMetadata(file);
    parseMetaData(document, metadata);
    const data = await preProcess(file, document, metadata, angle || 0, onDataUrlReady);
    // do the upload
    worker.push(
      c2c.uploadImage.bind(c2c),
      data,
      onUploadProgress,
      (event: { data: { filename: string; width?: number; height?: number; size?: number } }) => {
        const { filename, width, height, size } = event.data;
        document.filename = filename;
        // the original as stored: the server converts HEIC, and reduces the images over the limits (not SVG)
        setIfDefined(document, 'width', width);
        setIfDefined(document, 'height', height);
        setIfDefined(document, 'file_size', size);
        onSuccess(document);
      },
      onFailure
    );
  } catch {
    onFailure();
  }
};

export default uploadFile;
