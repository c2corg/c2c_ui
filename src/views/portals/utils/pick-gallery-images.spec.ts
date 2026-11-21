import { describe, expect, it } from 'vitest';

import { pickGalleryImages } from './pick-gallery-images';

// newest first, as the API lists them
const images = (...ids: number[]) => ids.map((document_id) => ({ document_id }));
const ids = (picked: { document_id: number }[]) => picked.map((image) => image.document_id);

describe('pickGalleryImages', () => {
  it('keeps at most 3 images of one upload when other uploads fill the gallery', () => {
    const listing = images(100, 99, 98, 97, 96, 90, 89, 88, 87, 80, 70, 69, 60);

    expect(ids(pickGalleryImages(listing, 10))).toEqual([100, 99, 98, 90, 89, 88, 80, 70, 69, 60]);
  });

  it('raises the cap when the uploads cannot fill the gallery', () => {
    // uploads of 6 and 5 images: 3 + 3, then a 4th of each, then a 5th of the first
    const listing = images(100, 99, 98, 97, 96, 95, 90, 89, 88, 87, 86);

    expect(ids(pickGalleryImages(listing, 9))).toEqual([100, 99, 98, 97, 96, 90, 89, 88, 87]);
  });

  it('shows the images of a single upload, as before', () => {
    const listing = images(20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9);

    expect(ids(pickGalleryImages(listing, 10))).toEqual([20, 19, 18, 17, 16, 15, 14, 13, 12, 11]);
  });

  it('returns all the images when there are fewer than asked', () => {
    expect(ids(pickGalleryImages(images(5, 4, 3, 2), 10))).toEqual([5, 4, 3, 2]);
    expect(pickGalleryImages([], 10)).toEqual([]);
  });

  it('keeps the listing order', () => {
    const listing = images(50, 40, 39, 38, 37, 30);

    expect(ids(pickGalleryImages(listing, 4))).toEqual([50, 40, 39, 38]);
    expect(ids(pickGalleryImages(listing, 5))).toEqual([50, 40, 39, 38, 30]);
  });
});
