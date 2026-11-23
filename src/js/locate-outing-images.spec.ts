import { beforeEach, describe, expect, it, vi } from 'vitest';

import { applyPlan, locateOutingImages, planOutingImages } from './locate-outing-images';

import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const { getHistory, getVersion, getImage, saveImage } = vi.hoisted(() => ({
  getHistory: vi.fn(),
  getVersion: vi.fn(),
  getImage: vi.fn(),
  saveImage: vi.fn(),
}));
vi.mock('@/js/apis/c2c', () => ({
  default: { outing: { getHistory, getVersion }, image: { get: getImage, save: saveImage } },
}));

const T0 = Date.UTC(2026, 10, 21, 9) / 1000;
const point = (x: number) => JSON.stringify({ type: 'Point', coordinates: [x, 5600000] });
const user = { isModerator: false, id: 7 };

// a track from 09:00 to 10:00 UTC, going east 1 km; the outing was first located at 0, then moved to 500
const outing = () =>
  ({
    type: 'o',
    document_id: 100,
    date_start: '2026-11-21',
    date_end: '2026-11-21',
    geometry: {
      geom: point(500),
      geom_detail: JSON.stringify({
        type: 'LineString',
        // a point every 5 minutes
        coordinates: Array.from({ length: 13 }, (_, i) => [
          (i * 1000) / 12,
          5600000,
          1000 + (i * 100) / 12,
          T0 + i * 300,
        ]),
      }),
    },
    associations: {
      routes: [],
      images: [1, 2, 3].map((id) => ({ document_id: id, available_langs: ['fr'], geometry: { geom: point(0) } })),
    },
  }) as unknown as C2cDocument;

const image = (id: number, geom: string, creator: number) => ({
  document_id: id,
  image_type: 'personal',
  creator: { user_id: creator },
  date_time: new Date((T0 + 1800) * 1000).toISOString(),
  geometry: { version: 1, geom },
});

describe('locateOutingImages', () => {
  beforeEach(() => {
    getHistory.mockResolvedValue({ data: { versions: [{ version_id: 11 }, { version_id: 12 }] } });
    getVersion.mockImplementation(async (_id, _lang, version: number) => ({
      data: { document: { geometry: { geom: point(version === 11 ? 0 : 500) } } },
    }));
    getImage.mockImplementation(async (id: number) => ({
      // 1: on a former location of the outing; 2: with its own location; 3: of another user
      data: [image(1, point(0), 7), image(2, point(42), 7), image(3, point(0), 8)][id - 1],
    }));
    saveImage.mockReset().mockResolvedValue({});
    getHistory.mockClear();
    getImage.mockClear();
  });

  it('saves the images of the user on a former location of the outing at their place on the track', async () => {
    const document = outing();
    const located = await locateOutingImages(document, 'fr', user, 'comment');

    expect(located.map((image) => image.document_id)).toEqual([1]);
    expect(saveImage).toHaveBeenCalledTimes(1);
    expect(saveImage).toHaveBeenCalledWith(
      expect.objectContaining({ document_id: 1, elevation: 1050, geometry: { version: 1, geom: point(500) } }),
      'comment'
    );
    // the map of the page follows
    expect(document.associations!.images![0]!.geometry!.geom).toBe(point(500));
  });

  it('reads the history only when an image is not on a current location of the outing', async () => {
    const document = outing();
    document.associations!.images!.forEach((image) => (image.geometry = { geom: point(500) }));
    await planOutingImages(document, 'fr', user);
    expect(getHistory).not.toHaveBeenCalled();
    expect(getImage).toHaveBeenCalled();
  });

  it('reads no image when none is on a default location', async () => {
    const document = outing();
    document.associations!.images!.forEach((image) => (image.geometry = { geom: point(42) }));
    expect((await planOutingImages(document, 'fr', user)).changes).toEqual([]);
    expect(getImage).not.toHaveBeenCalled();
  });

  it('saves again an image changed since it was read', async () => {
    const plan = await planOutingImages(outing(), 'fr', user);
    saveImage.mockRejectedValueOnce({ response: { status: 409 } });

    expect(await applyPlan(plan, 'comment')).toHaveLength(1);
    expect(getImage).toHaveBeenLastCalledWith(1, '');
    expect(saveImage).toHaveBeenCalledTimes(2);
  });

  it('keeps an image located by someone else since it was read', async () => {
    const plan = await planOutingImages(outing(), 'fr', user);
    saveImage.mockRejectedValueOnce({ response: { status: 409 } });
    getImage.mockResolvedValueOnce({ data: image(1, point(42), 7) });

    expect(await applyPlan(plan, 'comment')).toEqual([]);
    expect(saveImage).toHaveBeenCalledTimes(1);
  });

  it('tells when the history of the outing could not be read', async () => {
    getHistory.mockRejectedValueOnce(new Error('network'));
    expect((await planOutingImages(outing(), 'fr', user)).complete).toBe(false);
  });

  it('reads one image at a time, waiting when the API asks to slow down', async () => {
    vi.useFakeTimers();
    let running = 0;
    let most = 0;
    const respond = getImage.getMockImplementation()!;
    getImage.mockImplementation(async (...args: unknown[]) => {
      most = Math.max(most, ++running);
      await Promise.resolve();
      running--;
      return respond(...args);
    });
    getImage.mockRejectedValueOnce({ response: { status: 429 } });

    const planning = planOutingImages(outing(), 'fr', user);
    await vi.advanceTimersByTimeAsync(2000);
    const plan = await planning;
    vi.useRealTimers();

    expect(plan.changes.map((change) => change.document.document_id)).toEqual([1]);
    expect(getImage).toHaveBeenCalledTimes(4);
    expect(most).toBe(1);
  });

  it('reads only the images to locate when the outing gives the times and cameras of its images', async () => {
    const document = outing();
    const shot = new Date((T0 + 1800) * 1000).toISOString();
    document.associations!.images = [
      { document_id: 1, available_langs: ['fr'], geometry: { geom: point(0) }, date_time: shot, camera_name: null },
      { document_id: 2, available_langs: ['fr'], geometry: { geom: point(42) }, date_time: shot, camera_name: 'phone' },
    ];

    const plan = await planOutingImages(document, 'fr', user);

    expect(plan.changes.map((change) => change.document.document_id)).toEqual([1]);
    expect(getImage.mock.calls.map(([id]) => id)).toEqual([1]);
  });
});
