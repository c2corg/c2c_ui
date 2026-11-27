import { beforeEach, describe, expect, it, vi } from 'vitest';

import { refreshOutingQuality } from './refresh-outing-quality';

import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const { get, save } = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn() }));
vi.mock('@/js/apis/c2c', () => ({ default: { outing: { get, save } } }));

const author = { isModerator: false, id: 7 };
const other = { isModerator: false, id: 8 };
const moderator = { isModerator: true, id: 1 };

// a rock climbing outing, with the given quality and images
const stored = (quality: string, imageIds: number[]) =>
  ({
    type: 'o',
    document_id: 100,
    version: 3,
    quality,
    activities: ['rock_climbing'],
    associations: { users: [{ document_id: 7 }], routes: [], images: imageIds.map((id) => ({ document_id: id })) },
    locales: [{ lang: 'fr', route_description: 'route', description: 'comment', timing: '5h' }],
  }) as C2cDocument;

// the outing of the page
const page = { type: 'o', document_id: 100, associations: { users: [{ document_id: 7 }] } } as C2cDocument;

describe('refreshOutingQuality', () => {
  beforeEach(() => {
    get.mockReset();
    save.mockReset().mockResolvedValue({});
  });

  it('saves the quality computed with the added images', async () => {
    // route 0.5, comment 1, timing 0.5 = 2 (medium); with images 2.5: still medium
    get.mockResolvedValue({ data: stored('medium', [1]) });
    expect(await refreshOutingQuality(page, 'fr', [1], author, 'comment')).toBeNull();
    expect(save).not.toHaveBeenCalled();

    const outing = stored('draft', [1]);
    outing.locales![0] = { lang: 'fr', route_description: 'route', conditions: 'dry' };
    // route 0.5, conditions 1 = 1.5 (draft) before; 2 (medium) with the images
    get.mockResolvedValue({ data: outing });
    expect(await refreshOutingQuality(page, 'fr', [1], author, 'Quality computed again')).toBe('medium');
    expect(get).toHaveBeenCalledWith(100, 'fr');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ document_id: 100, quality: 'medium' }),
      'Quality computed again'
    );
  });

  it('keeps a quality chosen by the author', async () => {
    const outing = stored('fine', [1]);
    outing.locales![0] = { lang: 'fr', route_description: 'route', conditions: 'dry' };
    get.mockResolvedValue({ data: outing });
    expect(await refreshOutingQuality(page, 'fr', [1], author, 'comment')).toBeNull();

    get.mockResolvedValue({ data: stored('great', [1]) });
    expect(await refreshOutingQuality(page, 'fr', [1], author, 'comment')).toBeNull();
    expect(save).not.toHaveBeenCalled();
  });

  it('changes only the outings the user may edit', async () => {
    expect(await refreshOutingQuality(page, 'fr', [1], other, 'comment')).toBeNull();
    expect(get).not.toHaveBeenCalled();

    const outing = stored('draft', [1]);
    outing.locales![0] = { lang: 'fr', route_description: 'route', conditions: 'dry' };
    get.mockResolvedValue({ data: outing });
    expect(await refreshOutingQuality(page, 'fr', [1], moderator, 'comment')).toBe('medium');
  });

  it('does nothing for the other documents', async () => {
    expect(
      await refreshOutingQuality({ type: 'r', document_id: 5 } as C2cDocument, 'fr', [1], moderator, 'c')
    ).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });
});
