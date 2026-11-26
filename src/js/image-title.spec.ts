import { beforeEach, describe, expect, it, vi } from 'vitest';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { editableFromListing, findSamePhoto, loadEditableImage, saveImageTitle, titleLang } from '@/js/image-title';

const photo = { width: 4000, height: 3000, date_time: '2026-02-01T10:00:00+01:00', camera_name: 'Canon EOS' };

describe('findSamePhoto', () => {
  const listed = [{ document_id: 1, ...photo }];

  it('finds the photo with the same size and time of shot, whatever the time zone written', () => {
    expect(findSamePhoto({ ...photo, date_time: '2026-02-01T09:00:00Z' }, listed)?.document_id).toBe(1);
  });

  it('finds it when its time was stored in another time zone (as UTC by former versions)', () => {
    const stored = [{ document_id: 3, ...photo, date_time: '2026-02-01T10:00:00+00:00' }];
    expect(findSamePhoto(photo, stored)?.document_id).toBe(3);
    expect(findSamePhoto({ ...photo, date_time: '2026-02-01T15:45:00+05:45' }, stored)?.document_id).toBe(3);
  });

  it('finds it without a camera on one side', () => {
    expect(findSamePhoto({ ...photo, camera_name: null }, listed)?.document_id).toBe(1);
  });

  it.each([
    ['another time', { date_time: '2026-02-01T10:00:01+01:00' }],
    ['another minute', { date_time: '2026-02-01T10:01:00+01:00' }],
    ['a day apart', { date_time: '2026-02-02T10:00:00+01:00' }],
    ['another size', { width: 3999 }],
    ['another camera', { camera_name: 'Nikon' }],
    ['no time of shot', { date_time: null }],
  ])('does not find it with %s', (_, change) => {
    expect(findSamePhoto({ ...photo, ...change }, listed)).toBeUndefined();
  });

  it('does not take a listed image without a time of shot', () => {
    expect(findSamePhoto(photo, [{ document_id: 2, ...photo, date_time: null }])).toBeUndefined();
  });
});

describe('titleLang', () => {
  it('is the language of the title shown, else the first of the image, else the fallback', () => {
    expect(titleLang({ locales: [{ lang: 'it' }], available_langs: ['fr'] }, 'en')).toBe('it');
    expect(titleLang({ locales: [{}], available_langs: ['fr'] }, 'en')).toBe('fr');
    expect(titleLang({}, 'en')).toBe('en');
  });
});

describe('editableFromListing', () => {
  const user = { isLogged: true, isModerator: false, id: 7 };

  it.each([
    ['a collaborative image', { image_type: 'collaborative' }, user, true],
    ['a protected collaborative image', { image_type: 'collaborative', protected: true }, user, false],
    ['a personal image, for a moderator', { image_type: 'personal' }, { ...user, isModerator: true }, true],
    ['a personal image: its creator is unknown', { image_type: 'personal' }, user, undefined],
    ['anything, logged out', { image_type: 'collaborative' }, { isLogged: false, isModerator: false, id: null }, false],
  ])('knows %s', (_, image, who, expected) => {
    expect(editableFromListing(image, who)).toBe(expected);
  });
});

describe('image title', () => {
  const service = () => c2c.image as DocumentService;
  beforeEach(() => vi.restoreAllMocks());

  it.each([
    ['a collaborative image, by anyone', { image_type: 'collaborative', creator: { user_id: 1 } }, 7, true],
    ['a personal image, by its creator', { image_type: 'personal', creator: { user_id: 7 } }, 7, true],
    ['a personal image, not by another user', { image_type: 'personal', creator: { user_id: 1 } }, 7, false],
    ['nothing, logged out', { image_type: 'collaborative' }, null, false],
  ])('may change %s', async (_, image, id, editable) => {
    vi.spyOn(service(), 'get').mockResolvedValue({ data: { document_id: 5, ...image } } as never);
    const user = { isLogged: id !== null, isModerator: false, id };
    expect((await loadEditableImage(5, 'fr', user)).editable).toBe(editable);
    expect(service().get).toHaveBeenCalledWith(5, 'fr');
  });

  it('saves the image with its new title, without its associations', async () => {
    const save = vi.spyOn(service(), 'save').mockResolvedValue({} as never);
    const image = {
      document_id: 5,
      version: 3,
      locales: [{ lang: 'fr', title: 'Old', version: 2 }],
      associations: { outings: [{ document_id: 9 }] },
    };

    await saveImageTitle(image as never, 'New', 'comment');

    expect(save).toHaveBeenCalledWith(
      { document_id: 5, version: 3, locales: [{ lang: 'fr', title: 'New', version: 2 }] },
      'comment'
    );
  });
});
