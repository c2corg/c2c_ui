// The Favourites page: the All / Offline filters, the folders, the favourites without a network, the logged out notice
import { mount, RouterLinkStub } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

import FavouritesView from './FavouritesView.vue';

import type { SavedEntry } from '@/pwa/offline-store';
import type { Favourite, FavouriteFolder } from '@/stores/favourites';

const state = vi.hoisted(() => ({
  favourites: null as unknown as {
    isLogged: boolean;
    favourites: Favourite[];
    folders: FavouriteFolder[];
    removeAllOfflineCopies: () => Promise<void>;
  },
  offline: null as unknown as { online: boolean; entries: SavedEntry[] },
}));

vi.mock('@/stores/favourites', () => ({ useFavouritesStore: () => state.favourites }));
vi.mock('@/stores/offline', () => ({
  useOfflineStore: () => ({
    get online() {
      return state.offline.online;
    },
    get savedDocs() {
      return state.offline.entries;
    },
    find: (type: string, id: number) => state.offline.entries.find((entry) => entry.type === type && entry.id === id),
    isDownloading: () => false,
    checkAssets: async () => {},
  }),
}));
vi.mock('@/stores/outing-queue', () => ({
  useOutingQueueStore: () => ({ pending: [], ready: [], syncing: false, refresh: async () => {} }),
}));
vi.mock('@/js/composables/pull-refresh', () => ({ usePullRefresh: () => {} }));
vi.mock('vue-router', async (original) => ({
  ...(await original<typeof import('vue-router')>()),
  useRoute: () => ({ query: {}, fullPath: '/offline' }),
}));
const platform = vi.hoisted(() => ({ value: 'android' }));
vi.mock('@/pwa/install', () => ({ devicePlatform: () => platform.value, default: { installed: false } }));

const favourite = (type: string, id: number, folderId: string | null = null): Favourite => ({
  type,
  id,
  title: `${type} ${id}`,
  lang: 'fr',
  folderId,
  createdAt: id,
});

const offlineCopy = (type: string, id: number): SavedEntry => ({
  type,
  id,
  lang: 'fr',
  data: { document_id: id },
  title: `${type} ${id}`,
  folderId: null,
  mode: 'offline',
  savedAt: 0,
  downloadedAt: Date.now(),
  assets: { done: true, failed: 0, bytes: 2e6 },
});

function mountPage() {
  return mount(FavouritesView, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        HtmlHeader: true,
        IconDocument: true,
        InputDocument: true,
        FaIcon: { props: ['icon'], template: '<i :data-icon="icon" />' },
      },
      mocks: { $route: { fullPath: '/offline' } },
      config: {
        globalProperties: {
          $gettext: (s: string) => s,
          $language: { current: 'en' },
          $dateUtils: { timeAgo: () => 'today' },
        } as never,
      },
    },
  });
}

const chips = (wrapper: ReturnType<typeof mountPage>) =>
  wrapper.findAll('.filter-chips button').map((chip) => chip.text().replace(/\s+/g, ' '));
const groupNames = (wrapper: ReturnType<typeof mountPage>) =>
  wrapper.findAll('.favourites-group-name').map((name) => name.text());
const cardTitles = (wrapper: ReturnType<typeof mountPage>) =>
  wrapper.findAll('.favourite-card-title').map((title) => title.text());

describe('FavouritesView', () => {
  beforeEach(() => {
    platform.value = 'android';
    state.favourites = reactive({
      isLogged: true,
      // a route in a folder, saved offline; a waypoint and an outing without folder, the outing offline
      favourites: [favourite('route', 1, '5'), favourite('waypoint', 2), favourite('outing', 3)],
      folders: [
        { id: '5', name: 'Mont Blanc' },
        { id: '6', name: 'Empty' },
      ],
      removeAllOfflineCopies: vi.fn(async () => {}),
    });
    state.offline = reactive({ online: true, entries: [offlineCopy('route', 1), offlineCopy('outing', 3)] });
  });

  it('shows all the favourites in their folders, the empty ones too, No folder last', () => {
    const wrapper = mountPage();
    expect(chips(wrapper)).toEqual(['All 3', 'Offline 2']);
    expect(groupNames(wrapper)).toEqual(['Mont Blanc', 'Empty', 'No folder']);
    expect(cardTitles(wrapper)).toEqual(['route 1', 'waypoint 2', 'outing 3']);
    expect(wrapper.find('.status-line').text()).toBe('Synced with your account · 4 MB offline on this device');
    // offline copies only: a tag, no colour
    expect(wrapper.findAll('.favourite-card .tag').map((tag) => tag.text())).toEqual(['Offline', 'Offline']);
    // no removal of all favourites
    expect(wrapper.find('.remove-all-offline').exists()).toBe(false);
  });

  it('filters the offline copies, and removes them all, the favourites staying', async () => {
    const wrapper = mountPage();
    await wrapper.findAll('.filter-chips button')[1].trigger('click');

    expect(groupNames(wrapper)).toEqual(['Mont Blanc', 'No folder']);
    expect(cardTitles(wrapper)).toEqual(['route 1', 'outing 3']);
    const removeAll = wrapper.find('.remove-all-offline');
    expect(removeAll.text()).toContain('Remove all offline copies (4 MB)');
    expect(removeAll.text()).toContain('They stay in your favourites.');

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await removeAll.find('button').trigger('click');
    expect(state.favourites.removeAllOfflineCopies).toHaveBeenCalled();
  });

  it('opens on the offline copies without a network, the others folded apart', async () => {
    state.offline.online = false;
    const wrapper = mountPage();

    expect(wrapper.find('.filter-chips .is-primary').text()).toContain('Offline');
    expect(wrapper.find('.status-line').text()).toBe('Changes sync when the network is back');
    expect(cardTitles(wrapper)).toEqual(['route 1', 'outing 3']);
    const needNetwork = wrapper.find('.need-network');
    expect(needNetwork.text()).toContain('Need a network (1)');

    await needNetwork.find('button').trigger('click');
    expect(cardTitles(wrapper)).toEqual(['route 1', 'outing 3', 'waypoint 2']);
  });

  it('goes to the offline copies when the network goes', async () => {
    const wrapper = mountPage();
    state.offline.online = false;
    await nextTick();
    expect(wrapper.find('.filter-chips .is-primary').text()).toContain('Offline');
  });

  it('says logged out favourites stay on the device, and how to keep them on iPhone', async () => {
    state.favourites.isLogged = false;
    let wrapper = mountPage();
    expect(wrapper.find('.status-line').text()).toBe('On this device only');
    expect(wrapper.find('.device-only').text()).toContain('Create an account to find your favourites');
    expect(wrapper.find('.device-only').text()).not.toContain('iPhone');

    platform.value = 'ios';
    wrapper = mountPage();
    expect(wrapper.find('.device-only').text()).toContain('Safari clears the data of a site not opened for 7 days.');
  });

  it('offers to save offline a favourite, and to download again an old copy', () => {
    state.offline.entries[0] = { ...offlineCopy('route', 1), downloadedAt: Date.now() - 10 * 24 * 3600 * 1000 };
    const wrapper = mountPage();
    const icons = (index: number) =>
      wrapper
        .findAll('.favourite-card')
        [index].findAll('.favourite-card-actions [data-icon]')
        .map((icon) => icon.attributes('data-icon'));

    expect(icons(0)).toEqual(['rotate', 'ellipsis-vertical']);
    expect(wrapper.findAll('.favourite-card')[0].find('.tag.is-warning').text()).toBe('Old copy');
    expect(icons(1)).toEqual(['download', 'ellipsis-vertical']);
    expect(icons(2)).toEqual(['ellipsis-vertical']);
  });
});
