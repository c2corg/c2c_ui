// The one favourite button of a document page: the bookmark, its offline badge, and what a tap does in each state
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import FavouriteButton from './FavouriteButton.vue';

import type { SavedEntry } from '@/pwa/offline-store';

const DAY = 24 * 3600 * 1000;

const state = vi.hoisted(() => ({
  favourites: null as unknown as {
    isLogged: boolean;
    list: { type: string; id: number; folderId: string | null }[];
    add: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<void>>>;
    remove: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<void>>>;
    saveOffline: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<void>>>;
    removeOfflineCopy: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<void>>>;
  },
  offline: null as unknown as { entries: Partial<SavedEntry>[]; downloading: boolean },
}));

vi.mock('@/stores/favourites', () => ({
  useFavouritesStore: () => ({
    get isLogged() {
      return state.favourites.isLogged;
    },
    find: (type: string, id: number) => state.favourites.list.find((item) => item.type === type && item.id === id),
    isFavourite: (type: string, id: number) =>
      state.favourites.list.some((item) => item.type === type && item.id === id),
    add: (...args: unknown[]) => state.favourites.add(...args),
    remove: (...args: unknown[]) => state.favourites.remove(...args),
    saveOffline: (...args: unknown[]) => state.favourites.saveOffline(...args),
    removeOfflineCopy: (...args: unknown[]) => state.favourites.removeOfflineCopy(...args),
  }),
}));
vi.mock('@/stores/offline', () => ({
  useOfflineStore: () => ({
    find: (type: string, id: number) => state.offline.entries.find((entry) => entry.type === type && entry.id === id),
    isDownloading: () => state.offline.downloading,
  }),
}));

const toasts = vi.hoisted(() => ({ notify: vi.fn(), notifyWithAction: vi.fn(), toast: vi.fn() }));
vi.mock('@/js/toast', () => toasts);

const offlineCopy = (age: number, assets: SavedEntry['assets'] = { done: true, failed: 0 }): Partial<SavedEntry> => ({
  type: 'route',
  id: 12,
  mode: 'offline',
  data: { document_id: 12 },
  downloadedAt: Date.now() - age,
  assets,
});

function mountButton() {
  return mount(FavouriteButton, {
    props: { documentType: 'route', documentId: 12, lang: 'fr', title: 'Arête' },
    attachTo: document.body,
    global: {
      stubs: { FaIcon: { props: ['icon'], template: '<i :data-icon="icon" />' } },
      config: { globalProperties: { $gettext: (s: string) => s } as never },
    },
  });
}

// the component has two roots: the button, and its dialog in the body
const button = (wrapper: ReturnType<typeof mountButton>) => wrapper.find('.favourite-button');
const bookmark = (wrapper: ReturnType<typeof mountButton>) => wrapper.find('[data-icon="bookmark"]');
const badge = (wrapper: ReturnType<typeof mountButton>) => wrapper.find('.offline-badge');
const ROUTE = { type: 'route', id: 12, lang: 'fr', title: 'Arête' };

describe('FavouriteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    state.favourites = reactive({
      isLogged: true,
      list: [],
      add: vi.fn(async () => {}),
      remove: vi.fn(async () => {}),
      saveOffline: vi.fn(async () => {}),
      removeOfflineCopy: vi.fn(async () => {}),
    });
    state.offline = reactive({ entries: [], downloading: false });
  });

  it('adds a favourite, and offers to save it offline', async () => {
    const wrapper = mountButton();
    expect(bookmark(wrapper).classes()).toContain('has-text-grey-light');
    expect(badge(wrapper).exists()).toBe(false);
    expect(button(wrapper).attributes('title')).toBe('Add to favourites');

    await button(wrapper).trigger('click');
    await flushPromises();
    expect(state.favourites.add).toHaveBeenCalledWith(ROUTE);
    expect(toasts.notifyWithAction).toHaveBeenCalledWith(
      'Added to favourites.',
      'Also save offline',
      expect.any(Function)
    );

    // the button of the toast
    toasts.notifyWithAction.mock.calls[0][2]();
    expect(state.favourites.saveOffline).toHaveBeenCalledWith(ROUTE);
  });

  it('says the favourite stays on the device when logged out', async () => {
    state.favourites.isLogged = false;
    await button(mountButton()).trigger('click');
    await flushPromises();
    expect(toasts.notifyWithAction.mock.calls[0][0]).toBe('Added to favourites. Saved on this device only.');
  });

  it('removes a favourite at once, and undoes it in its folder', async () => {
    state.favourites.list.push({ type: 'route', id: 12, folderId: '5' });
    const wrapper = mountButton();
    expect(bookmark(wrapper).classes()).toContain('has-text-primary');
    expect(button(wrapper).attributes('title')).toBe('Remove from favourites');

    await button(wrapper).trigger('click');
    await flushPromises();
    expect(state.favourites.remove).toHaveBeenCalledWith('route', 12);
    const [text, label, undo] = toasts.notifyWithAction.mock.calls[0];
    expect([text, label]).toEqual(['Removed from favourites.', 'Undo']);

    undo();
    expect(state.favourites.add).toHaveBeenCalledWith(ROUTE, '5');
  });

  it('shows the state of the offline copy on its badge', async () => {
    state.favourites.list.push({ type: 'route', id: 12, folderId: null });
    state.offline.entries.push(offlineCopy(DAY));
    const wrapper = mountButton();
    expect(badge(wrapper).classes()).toContain('is-fresh');
    expect(badge(wrapper).find('[data-icon="arrow-down"]').exists()).toBe(true);

    state.offline.entries[0] = offlineCopy(10 * DAY);
    await flushPromises();
    expect(badge(wrapper).classes()).toContain('is-old');

    state.offline.entries[0] = offlineCopy(DAY, { done: true, failed: 2 });
    await flushPromises();
    expect(badge(wrapper).classes()).toContain('is-incomplete');

    state.offline.downloading = true;
    await flushPromises();
    expect(badge(wrapper).classes()).toContain('is-busy');
    // nothing while it downloads
    await button(wrapper).trigger('click');
    expect(state.favourites.remove).not.toHaveBeenCalled();
  });

  it('asks what to remove of a favourite saved offline', async () => {
    state.favourites.list.push({ type: 'route', id: 12, folderId: null });
    state.offline.entries.push(offlineCopy(DAY));
    const wrapper = mountButton();

    await button(wrapper).trigger('click');
    const modal = document.body.querySelector('.modal')!;
    expect(modal.classList).toContain('is-active');
    expect(modal.textContent).toContain('This topo is saved offline');
    expect(state.favourites.remove).not.toHaveBeenCalled();

    const [keep, removeBoth] = modal.querySelectorAll<HTMLButtonElement>('.favourite-choices button');
    keep.click();
    await flushPromises();
    expect(state.favourites.removeOfflineCopy).toHaveBeenCalledWith('route', 12);
    expect(state.favourites.remove).not.toHaveBeenCalled();

    await button(wrapper).trigger('click');
    removeBoth.click();
    await flushPromises();
    expect(state.favourites.remove).toHaveBeenCalledWith('route', 12);
    wrapper.unmount();
  });
});
