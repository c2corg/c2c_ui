import 'fake-indexeddb/auto';
import { clear } from 'idb-keyval';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import { useOutingQueueStore } from './outing-queue';

const create = vi.hoisted(() => vi.fn());
vi.mock('@/js/apis/c2c', () => ({ default: { outing: { create } } }));
const user = vi.hoisted(() => ({ isLogged: true, id: 42 as number | null }));
vi.mock('@/stores/user', () => ({ useUserStore: () => user }));
vi.mock('@/stores/language', () => ({ useLanguageStore: () => ({ gettext: (text: string) => text }) }));
vi.mock('@/stores/offline', () => ({ useOfflineStore: () => ({ online: true }) }));
vi.mock('@/js/toast', () => ({ toast: vi.fn() }));

// an outing as the form gives it: a reactive proxy, which IndexedDB cannot store as it is
const outing = (title: string, routes = [{ document_id: 1 }]) =>
  reactive({ type: 'o', locales: [{ lang: 'fr', title }], associations: { routes, users: [] } });

describe('outings waiting on the phone', () => {
  beforeEach(async () => {
    await clear();
    setActivePinia(createPinia());
    create.mockReset();
    user.isLogged = true;
    user.id = 42;
  });

  it('keeps the outings of a user to them, on a device shared with others', async () => {
    const queue = useOutingQueueStore();
    const mine = await queue.add(outing('La mienne'));

    // someone else signs in on the same device: neither listed, nor opened by its address, nor published
    user.id = 7;
    setActivePinia(createPinia());
    const theirs = useOutingQueueStore();
    await theirs.refresh();
    expect(theirs.pending).toEqual([]);
    expect(await theirs.get(mine.id)).toBeNull();
    await theirs.publish();
    expect(create).not.toHaveBeenCalled();

    // signed out: nobody's; back again: hers
    user.id = null;
    setActivePinia(createPinia());
    const nobody = useOutingQueueStore();
    await nobody.refresh();
    expect(nobody.pending).toEqual([]);
    user.id = 42;
    setActivePinia(createPinia());
    const back = useOutingQueueStore();
    await back.refresh();
    expect(back.pending.map((item) => item.title)).toEqual(['La mienne']);
  });

  it('publishes the ready ones when asked, with their author', async () => {
    const queue = useOutingQueueStore();
    await queue.add(outing('Dent du Requin'));
    await queue.add(outing('Sans itinéraire', []), 'face sud');
    expect(queue.pending).toHaveLength(2);
    expect(queue.ready).toHaveLength(1);

    create.mockResolvedValue({ data: { document_id: 99 } });
    await queue.publish();
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].associations.users).toEqual([{ document_id: 42 }]);
    // the one without a route waits
    expect(queue.pending.map((item) => item.title)).toEqual(['Sans itinéraire']);

    await queue.attachRoute(queue.pending[0].id, { document_id: 5 });
    expect(queue.ready).toHaveLength(1);
    expect(queue.pending[0].payload.associations?.routes).toEqual([{ document_id: 5 }]);
  });

  it('freezes a refused outing with the reason, and one sent without an answer', async () => {
    const queue = useOutingQueueStore();
    await queue.add(outing('Refusée'));
    create.mockRejectedValueOnce({
      response: { status: 400, data: { errors: [{ name: 'date_start', description: 'Required' }] } },
    });
    await queue.publish();
    expect(queue.pending[0]).toMatchObject({
      conflict: true,
      freezeReason: 'invalid',
      lastError: '400 — date_start: Required',
    });

    await queue.retry(queue.pending[0].id);
    create.mockRejectedValueOnce({ code: 'ECONNABORTED', message: 'timeout' });
    await queue.publish();
    expect(queue.pending[0]).toMatchObject({ conflict: true, ambiguous: true });
  });

  it('publishes nothing without a signed in user, and says when a draft is gone', async () => {
    const queue = useOutingQueueStore();
    const item = await queue.add(outing('Brouillon'));
    user.isLogged = false;
    await queue.publish();
    expect(create).not.toHaveBeenCalled();

    expect(await queue.edit(item.id, outing('Brouillon modifié'))).toBe(true);
    expect((await queue.get(item.id))?.title).toBe('Brouillon modifié');
    await queue.remove(item.id);
    expect(await queue.edit(item.id, outing('Trop tard'))).toBe(false);
  });
});
