import type { ExpandedTags } from 'exifreader';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import c2c from '@/js/apis/c2c';
import uploadFile, { parseMetaData, storedSize, toMetadata } from '@/js/upload-file';

const ExifReader = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('exifreader', () => ({ default: ExifReader }));

describe('upload-file parseMetaData', () => {
  it('reads the date, camera, exposure and position of the metadata', () => {
    const document: Record<string, unknown> = {};

    parseMetaData(document, {
      orientation: 6,
      make: 'Canon',
      model: 'EOS',
      date: '2026:01:10 08:30:00',
      offset: '+01:00',
      exposureTime: 0.004,
      fnumber: 8,
      iso: 200,
      focalLength: 28,
      latitude: 45.175,
      longitude: 5.72,
      altitude: 2100.5,
    });

    expect(document).toMatchObject({
      camera_name: 'Canon EOS',
      exposure_time: 0.004,
      fnumber: 8,
      iso_speed: 200,
      focal_length: 28,
      elevation: 2100.5,
    });
    const { coordinates } = JSON.parse((document.geometry as { geom: string }).geom);
    // the time of the shot, with its offset
    expect(Date.parse(document.date_time as string)).toBe(Date.parse('2026-01-10T08:30:00+01:00'));
    expect(coordinates[0]).toBeCloseTo(636_747.5, 0); // 5.72° E, in Web Mercator
    expect(coordinates[1]).toBeGreaterThan(5_600_000);
  });

  it('reads an ISO 8601 date, and ignores a position out of the world', () => {
    const document: Record<string, unknown> = {};
    parseMetaData(document, { date: '2026-01-10T14:30:00+01:00', latitude: 95, longitude: 5 });
    expect(Date.parse(document.date_time as string)).toBe(Date.parse('2026-01-10T14:30:00+01:00'));
    expect(document.geometry).toBeUndefined();
  });

  it('ignores a file without metadata, and a date that cannot be read', () => {
    const document: Record<string, unknown> = {};
    parseMetaData(document, undefined);
    parseMetaData(document, { date: 'yesterday', make: 'Canon' });
    // no date: null, as before
    expect(document).toEqual({ date_time: null });
  });
});

describe('upload-file toMetadata', () => {
  // as ExifReader gives them (expanded), from an iPhone 15 Pro HEIC
  const iphone = {
    exif: {
      DateTimeOriginal: { value: ['2023:10:31 11:44:43'], description: '2023:10:31 11:44:43' },
      OffsetTimeOriginal: { value: ['+01:00'], description: '+01:00' },
      ExposureTime: { value: [1, 60], description: '1/60' },
      ISOSpeedRatings: { value: 400, description: '400' },
      FocalLengthIn35mmFilm: { value: 14, description: '14 mm' },
      FNumber: { value: [11, 5], description: 'f/2.2' },
      Make: { value: ['Apple'], description: 'Apple' },
      Model: { value: ['iPhone 15 Pro'], description: 'iPhone 15 Pro' },
      Orientation: { value: 6, description: 'right-top' },
      PixelXDimension: { value: 4032, description: '4032' },
      PixelYDimension: { value: 3024, description: '3024' },
    },
    gps: { Latitude: -52.459605555555555, Longitude: 13.321841666666666, Altitude: 50.15 },
    file: { 'Image Width': { value: 4032, description: '4032px' } },
  } as unknown as ExpandedTags;

  it('reads the EXIF and GPS tags', () => {
    expect(toMetadata(iphone)).toEqual({
      date: '2023:10:31 11:44:43',
      offset: '+01:00',
      exposureTime: 1 / 60,
      iso: 400,
      focalLength: 14,
      fnumber: 2.2,
      make: 'Apple',
      model: 'iPhone 15 Pro',
      latitude: -52.459605555555555,
      longitude: 13.321841666666666,
      altitude: 50.15,
      width: 4032,
      height: 3024,
      orientation: 6,
    });
  });

  it('prefers the IPTC date, with its time and offset or not', () => {
    const iptc = (time?: string) =>
      toMetadata({
        ...iphone,
        iptc: {
          'Date Created': { description: '2026-01-10' },
          ...(time ? { 'Time Created': { description: time } } : {}),
        },
      } as unknown as ExpandedTags);
    expect(iptc('14:30:00+01:00')).toMatchObject({ date: '2026-01-10T14:30:00+01:00', offset: undefined });
    expect(iptc()).toMatchObject({ date: '2026-01-10T00:00:00' });
  });

  it('reads the size of the file without EXIF, and nothing more', () => {
    const tags = { file: { 'Image Width': { value: 900 }, 'Image Height': { value: 400 } } } as unknown as ExpandedTags;
    expect(toMetadata(tags)).toMatchObject({ width: 900, height: 400, date: undefined, make: undefined });
  });
});

describe('upload-file storedSize', () => {
  it.each([
    // [width, height, stored]
    [4032, 3024, { width: 3072, height: 2304 }], // 12 MP phone photo
    [3024, 4032, { width: 2304, height: 3072 }], // portrait
    [5184, 3200, { width: 3072, height: 1896 }],
    [3072, 2048, undefined], // already small enough
    [1200, 800, undefined],
    [8000, 3000, { width: 5461, height: 2048 }], // panorama: short side 2048
    [12000, 3000, { width: 8000, height: 2000 }], // panorama: 16 megapixels
    [3000, 9000, { width: 2048, height: 6144 }], // vertical panorama
    [6000, 2000, undefined], // panorama of 12 megapixels
  ])('%i x %i', (width, height, stored) => {
    expect(storedSize(width, height)).toEqual(stored);
  });

  it('keeps the panoramas under 16 megapixels whatever their ratio', () => {
    const { width, height } = storedSize(36000, 3000)!;
    expect(width * height).toBeLessThanOrEqual(16_000_000);
    expect(width / height).toBeCloseTo(12, 1);
  });
});

describe('upload-file uploadFile', () => {
  // the images the mocked browser decodes, by object URL: their natural size
  let decodable: Map<string, { width: number; height: number }>;
  let objectUrls = 0;
  let drawn: { width: number; height: number; type?: string; quality?: number; rotation: number } | undefined;

  beforeEach(() => {
    decodable = new Map();
    drawn = undefined;
    ExifReader.load.mockResolvedValue({});
    objectUrls = 0;
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:${++objectUrls}`);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.stubGlobal(
      'Image',
      class {
        public naturalWidth = 0;
        public naturalHeight = 0;
        public onload?: () => void;
        public onerror?: () => void;
        #src = '';
        public get src() {
          return this.#src;
        }
        public set src(url: string) {
          this.#src = url;
          const size = decodable.get(url);
          setTimeout(() => {
            if (size) {
              this.naturalWidth = size.width;
              this.naturalHeight = size.height;
              this.onload?.();
            } else {
              this.onerror?.();
            }
          });
        }
      }
    );
    const context = {
      translate: vi.fn(),
      rotate: vi.fn((radians: number) => (drawn = { ...drawn!, rotation: Math.round((radians * 180) / Math.PI) })),
      drawImage: vi.fn(
        (_img: unknown, _x: number, _y: number, width: number, height: number) =>
          (drawn = { rotation: 0, ...drawn, width, height })
      ),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      callback: BlobCallback,
      type?: string,
      quality?: number
    ) {
      drawn = { ...drawn!, type, quality };
      callback(new Blob(['rendered'], { type }));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // uploads a file, and gives what was sent and the document
  const upload = async (file: File, angle = 0, stored: Record<string, number> = {}) => {
    const send = vi.spyOn(c2c, 'uploadImage').mockImplementation((data, _progress, onSuccess) => {
      onSuccess({ data: { filename: '1_2.jpg', ...stored } } as Parameters<typeof onSuccess>[0]);
      return Promise.resolve() as ReturnType<typeof c2c.uploadImage>;
    });
    const dataUrls: (string | null)[] = [];
    const document = await new Promise<Record<string, unknown>>((resolve, reject) =>
      uploadFile(file, angle, (dataUrl) => dataUrls.push(dataUrl), vi.fn(), resolve, reject)
    );
    return { sent: send.mock.calls[0]![0], document, dataUrls };
  };

  const file = (name: string, type: string, size?: { width: number; height: number }) => {
    const created = new File(['content'], name, { type });
    if (size) {
      // the next object URL is the one of the file
      decodable.set(`blob:${objectUrls + 1}`, size);
    }
    return created;
  };

  it('sends a photo under the limits as it is, with its metadata', async () => {
    ExifReader.load.mockResolvedValue({
      exif: { Make: { description: 'Apple' }, Model: { description: 'iPhone 15 Pro' }, Orientation: { value: 6 } },
    });
    const photo = file('photo.jpg', 'image/jpeg', { width: 2304, height: 3072 });

    const { sent, document, dataUrls } = await upload(photo);

    expect(sent).toBe(photo);
    expect(drawn).toBeUndefined();
    expect(dataUrls).toEqual(['blob:1']);
    expect(document).toMatchObject({
      camera_name: 'Apple iPhone 15 Pro',
      width: 2304,
      height: 3072,
      filename: '1_2.jpg',
    });
  });

  it('reduces a large photo, as JPEG 0.9', async () => {
    const { sent, document, dataUrls } = await upload(file('photo.jpg', 'image/jpeg', { width: 4032, height: 3024 }));

    expect(sent).not.toBeInstanceOf(File);
    expect(drawn).toEqual({ width: 3072, height: 2304, rotation: 0, type: 'image/jpeg', quality: 0.9 });
    expect(document).toMatchObject({ width: 3072, height: 2304, file_size: 8 });
    expect(dataUrls).toEqual(['blob:2']);
  });

  it('keeps PNG as PNG', async () => {
    await upload(file('drawing.png', 'image/png', { width: 5000, height: 4000 }));
    expect(drawn?.type).toBe('image/png');
  });

  it('turns an image the user rotated, even a small one', async () => {
    const { document } = await upload(file('photo.jpg', 'image/jpeg', { width: 1200, height: 800 }), 90);

    expect(drawn).toMatchObject({ width: 1200, height: 800, rotation: 90 });
    expect(document).toMatchObject({ width: 800, height: 1200 });
  });

  it.each([
    ['animation.gif', 'image/gif'],
    ['topo.svg', 'image/svg+xml'],
  ])('sends %s as it is', async (name, type) => {
    const image = file(name, type, { width: 5000, height: 4000 });
    const { sent } = await upload(image, 90);
    expect(sent).toBe(image);
    expect(drawn).toBeUndefined();
  });

  it('sends a HEIC the browser cannot decode as it is, without preview, sized from its EXIF', async () => {
    ExifReader.load.mockResolvedValue({
      exif: {
        Make: { description: 'samsung' },
        Model: { description: 'SM-G781B' },
        DateTimeOriginal: { description: '2022:04:23 08:59:35' },
        OffsetTimeOriginal: { description: '+02:00' },
        Orientation: { value: 6 },
      },
      file: { 'Image Width': { value: 4032 }, 'Image Height': { value: 3024 } },
    });
    const heic = file('photo.heic', 'image/heic');

    const { sent, document, dataUrls } = await upload(heic);

    expect(sent).toBe(heic);
    expect(dataUrls).toEqual([null]);
    expect(document).toMatchObject({ camera_name: 'samsung SM-G781B', width: 3024, height: 4032 });
    expect(Date.parse(document.date_time as string)).toBe(Date.parse('2022-04-23T08:59:35+02:00'));
  });

  it('takes the size of the original as the server stores it', async () => {
    const heic = file('photo.heic', 'image/heic');
    const { document } = await upload(heic, 0, { width: 2304, height: 3072, size: 1_200_000 });
    expect(document).toMatchObject({ width: 2304, height: 3072, file_size: 1_200_000 });
  });

  it('fails when the rendering fails, freeing the decoded file', async () => {
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation((callback: BlobCallback) => callback(null));
    const onFailure = vi.fn();
    const onSuccess = vi.fn();
    await uploadFile(
      file('photo.jpg', 'image/jpeg', { width: 4032, height: 3024 }),
      0,
      vi.fn(),
      vi.fn(),
      onSuccess,
      onFailure
    );
    expect(onFailure).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
  });

  it('uploads a file whose metadata cannot be read', async () => {
    ExifReader.load.mockRejectedValue(new Error('Invalid image format'));
    const { sent } = await upload(file('photo.jpg', 'image/jpeg', { width: 800, height: 600 }));
    expect(sent).toBeInstanceOf(File);
  });
});
