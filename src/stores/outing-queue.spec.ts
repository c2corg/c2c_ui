import 'fake-indexeddb/auto';
import { clear } from 'idb-keyval';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import { useOutingQueueStore } from './outing-queue';

import { listPending, writePending } from '@/pwa/outing-queue';

const create = vi.hoisted(() => vi.fn());
vi.mock('@/js/apis/c2c', () => ({ default: { outing: { create } } }));
const user = vi.hoisted(() => ({ isLogged: true, id: 42 as number | null }));
vi.mock('@/stores/user', () => ({ useUserStore: () => user }));
vi.mock('@/stores/language', () => ({ useLanguageStore: () => ({ gettext: (text: string) => text }) }));
vi.mock('@/stores/offline', () => ({ useOfflineStore: () => ({ online: true }) }));
vi.mock('@/js/toast', () => ({ notify: vi.fn() }));

// an outing as the form gives it: a reactive proxy, which IndexedDB cannot store as it is
const outing = (title: string, routes = [{ document_id: 1 }]) =>
  reactive({ type: 'o', locales: [{ lang: 'fr', title }], associations: { routes, users: [] } });

// a store as another tab of the app has it: its own, on the same IndexedDB
const otherTab = async () => {
  setActivePinia(createPinia());
  const queue = useOutingQueueStore();
  await queue.refresh();
  return queue;
};

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

  it('keeps an outing to the author given, though the session went meanwhile', async () => {
    // the API refused the session while saving: the user is signed out when the outing is kept
    user.id = null;
    const item = await useOutingQueueStore().add(outing('Après le 401'), '', 42);
    expect(item.owner).toBe(42);

    // signed in again: theirs
    user.id = 42;
    setActivePinia(createPinia());
    const back = useOutingQueueStore();
    await back.refresh();
    expect(back.pending.map((entry) => entry.title)).toEqual(['Après le 401']);
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

  it('freezes an outing sent without an answer from the first time, and does not send it again', async () => {
    const queue = useOutingQueueStore();
    await queue.add(outing('Sans réponse'));
    create.mockRejectedValueOnce({ code: 'ERR_NETWORK', message: 'Network Error' });
    await queue.publish();
    expect(queue.pending[0]).toMatchObject({
      conflict: true,
      freezeReason: 'unanswered',
      ambiguous: true,
      attempts: 1,
    });
    expect(queue.ready).toEqual([]);

    await queue.publish();
    expect(create).toHaveBeenCalledOnce();
  });

  it('sends nothing without a network: the outings stay ready, not frozen for nothing', async () => {
    const queue = useOutingQueueStore();
    await queue.add(outing('Au refuge'));
    const offline = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    await queue.publish();
    offline.mockRestore();
    expect(create).not.toHaveBeenCalled();
    expect(queue.ready).toHaveLength(1);
  });

  it('keeps to be checked an outing the form sent without an answer', async () => {
    const queue = useOutingQueueStore();
    const sent = await queue.add(outing('Formulaire sans réponse'), '', 42, true);
    expect(sent).toMatchObject({ conflict: true, freezeReason: 'unanswered', ambiguous: true });

    const draft = await queue.add(outing('Brouillon'));
    await queue.edit(draft.id, outing('Brouillon envoyé'), true);
    expect(queue.pending.find((item) => item.id === draft.id)).toMatchObject({ freezeReason: 'unanswered' });
    expect(queue.ready).toEqual([]);
  });

  it('publishes an outing once, though two tabs send it at the same time', async () => {
    const first = useOutingQueueStore();
    await first.add(outing('Deux onglets'));
    const second = await otherTab();
    let answer: (response: unknown) => void = () => {};
    create.mockImplementation(() => new Promise((resolve) => (answer = resolve)));

    const sending = [first.publish(), second.publish()];
    await vi.waitFor(() => expect(create).toHaveBeenCalled());
    answer({ data: { document_id: 9 } });
    await Promise.all(sending);

    expect(create).toHaveBeenCalledOnce();
    expect(await listPending()).toEqual([]);
  });

  it('does not send again an outing another tab published meanwhile', async () => {
    const first = useOutingQueueStore();
    await first.add(outing('Déjà publiée'));
    // loaded before the first tab published it: its list still shows the outing
    const second = await otherTab();
    create.mockResolvedValue({ data: { document_id: 9 } });

    await first.publish();
    await second.publish();

    expect(create).toHaveBeenCalledOnce();
  });

  it('puts to be checked an outing whose tab went in the middle of its send', async () => {
    const item = (await useOutingQueueStore().add(outing('Onglet fermé'))) as object;
    // marked as sending, without its tab: closed before the answer came
    await writePending([{ ...item, sending: true } as never]);

    const queue = await otherTab();

    expect(queue.pending[0]).toMatchObject({
      sending: false,
      conflict: true,
      freezeReason: 'unanswered',
      ambiguous: true,
    });
    await queue.publish();
    expect(create).not.toHaveBeenCalled();
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
