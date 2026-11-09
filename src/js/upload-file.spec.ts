import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import c2c from '@/js/apis/c2c';
import uploadFile, { parseMetaData, storedSize } from '@/js/upload-file';

const exifr = vi.hoisted(() => ({ parse: vi.fn() }));
vi.mock('exifr', () => ({ default: exifr }));

describe('upload-file parseMetaData', () => {
  it('reads the date, camera, exposure and position of the metadata', () => {
    const document: Record<string, unknown> = {};

    // as exifr gives them: values as stored, latitude and longitude computed
    parseMetaData(document, {
      Orientation: 6,
      Make: 'Canon',
      Model: 'EOS',
      DateTimeOriginal: '2026:01:10 08:30:00',
      OffsetTimeOriginal: '+01:00',
      ExposureTime: 0.004,
      FNumber: 8,
      ISO: 200,
      FocalLengthIn35mmFormat: 28,
      latitude: 45.175,
      longitude: 5.72,
      GPSAltitude: 2100.5,
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

  it('prefers the IPTC date, and ignores a position out of the world or a missing one', () => {
    const document: Record<string, unknown> = {};

    parseMetaData(document, {
      latitude: 95,
      longitude: 5,
      DateCreated: '20260110',
      DateTimeOriginal: '2025:01:01 00:00:00',
    });

    expect(document.date_time).toMatch(/^2026-01-10T00:00:00/);
    expect(document.geometry).toBeUndefined();
  });

  it('reads the IPTC time, with or without its offset', () => {
    const withOffset: Record<string, unknown> = {};
    parseMetaData(withOffset, { DateCreated: '20260110', TimeCreated: '143000+0100' });
    expect(Date.parse(withOffset.date_time as string)).toBe(Date.parse('2026-01-10T14:30:00+01:00'));

    const withoutOffset: Record<string, unknown> = {};
    parseMetaData(withoutOffset, { DateCreated: '20260110', TimeCreated: '143000' });
    expect(withoutOffset.date_time).toMatch(/^2026-01-10T14:30:00/);
  });

  it('ignores a file without metadata, and values of the wrong type', () => {
    const document: Record<string, unknown> = {};
    parseMetaData(document, undefined);
    parseMetaData(document, { ExposureTime: 'fast', Make: 'Canon' });
    // no date: null, as before
    expect(document).toEqual({ date_time: null });
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
    exifr.parse.mockResolvedValue(undefined);
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
  const upload = async (file: File, angle = 0) => {
    const send = vi.spyOn(c2c, 'uploadImage').mockImplementation((data, _progress, onSuccess) => {
      onSuccess({ data: { filename: '1_2.jpg' } } as Parameters<typeof onSuccess>[0]);
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
    exifr.parse.mockResolvedValue({ Make: 'Apple', Model: 'iPhone 15 Pro', Orientation: 6 });
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
    exifr.parse.mockResolvedValue({
      Make: 'samsung',
      Model: 'SM-G781B',
      DateTimeOriginal: '2022:04:23 08:59:35',
      OffsetTimeOriginal: '+02:00',
      ExifImageWidth: 4032,
      ExifImageHeight: 3024,
      Orientation: 6,
    });
    const heic = file('photo.heic', 'image/heic');

    const { sent, document, dataUrls } = await upload(heic);

    expect(sent).toBe(heic);
    expect(dataUrls).toEqual([null]);
    expect(document).toMatchObject({ camera_name: 'samsung SM-G781B', width: 3024, height: 4032 });
    expect(Date.parse(document.date_time as string)).toBe(Date.parse('2022-04-23T08:59:35+02:00'));
  });

  it('uploads a file whose metadata cannot be read', async () => {
    exifr.parse.mockRejectedValue(new Error('Unknown file format'));
    const { sent } = await upload(file('photo.jpg', 'image/jpeg', { width: 800, height: 600 }));
    expect(sent).toBeInstanceOf(File);
  });
});
