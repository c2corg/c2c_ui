import { beforeEach, describe, expect, it, vi } from 'vitest';

import { locateOutingImages } from './locate-outing-images';

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
});
