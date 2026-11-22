// After signing in: the favourites saved on the device logged out, offered to the account
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import DeviceFavouritesPrompt from './DeviceFavouritesPrompt.vue';

const state = vi.hoisted(() => ({
  favourites: null as unknown as {
    deviceOffer: { type: string; id: number; title: string; mode: string }[];
    acceptDeviceFavourites: () => Promise<void>;
    declineDeviceFavourites: () => Promise<void>;
  },
}));
vi.mock('@/stores/favourites', () => ({ useFavouritesStore: () => state.favourites }));
vi.mock('@/js/toast', () => ({ toast: vi.fn() }));
const user = vi.hoisted(() => ({ state: null as unknown as { id: number | null } }));
vi.mock('@/stores/user', () => ({ useUserStore: () => user.state }));

const entry = (id: number, mode = 'online') => ({ type: 'route', id, title: `Voie ${id}`, mode });

const mountPrompt = () =>
  mount(DeviceFavouritesPrompt, {
    global: {
      stubs: { FaIcon: true },
      config: { globalProperties: { $gettext: (text: string) => text } as never },
    },
  });

const isOpen = (wrapper: ReturnType<typeof mountPrompt>) => wrapper.find('.modal').classes('is-active');
const button = (wrapper: ReturnType<typeof mountPrompt>, text: string) =>
  wrapper.findAll('button').find((item) => item.text() === text)!;

describe('DeviceFavouritesPrompt', () => {
  beforeEach(() => {
    user.state = reactive({ id: 7 });
    state.favourites = reactive({
      deviceOffer: [] as ReturnType<typeof entry>[],
      acceptDeviceFavourites: vi.fn(async () => {
        state.favourites.deviceOffer = [];
      }),
      declineDeviceFavourites: vi.fn(async () => {
        state.favourites.deviceOffer = [];
      }),
    });
  });

  it('opens when there are favourites to offer, and lists them, the offline copies marked', async () => {
    const wrapper = mountPrompt();
    await flushPromises();
    expect(isOpen(wrapper)).toBe(false);

    state.favourites.deviceOffer = [entry(1), entry(2, 'offline')];
    await flushPromises();
    expect(isOpen(wrapper)).toBe(true);
    expect(wrapper.findAll('.device-favourites li').map((item) => item.text())).toEqual(['Voie 1', 'Voie 2']);
    expect(wrapper.findAll('.device-favourites li')[1].find('fa-icon-stub').exists()).toBe(true);
  });

  it('shows a few titles, and how many more', async () => {
    state.favourites.deviceOffer = Array.from({ length: 11 }, (_, index) => entry(index));
    const wrapper = mountPrompt();
    await flushPromises();
    const items = wrapper.findAll('.device-favourites li');
    expect(items).toHaveLength(9);
    expect(items[8].text()).toBe('+ 3');
  });

  it('adds them to the account, or keeps them on the device', async () => {
    state.favourites.deviceOffer = [entry(1)];
    const wrapper = mountPrompt();
    await flushPromises();
    await button(wrapper, 'Add to my favourites').trigger('click');
    await flushPromises();
    expect(state.favourites.acceptDeviceFavourites).toHaveBeenCalledOnce();
    expect(isOpen(wrapper)).toBe(false);

    state.favourites.deviceOffer = [entry(2)];
    const other = mountPrompt();
    await flushPromises();
    await button(other, 'Keep on this device').trigger('click');
    await flushPromises();
    expect(state.favourites.declineDeviceFavourites).toHaveBeenCalledOnce();
    expect(isOpen(other)).toBe(false);
  });

  it('asks again at the next sign in after an answer', async () => {
    state.favourites.deviceOffer = [entry(1)];
    const wrapper = mountPrompt();
    await flushPromises();
    await button(wrapper, 'Keep on this device').trigger('click');
    await flushPromises();

    // logged out, a favourite saved, then signed in again in the same tab
    user.state.id = null;
    await flushPromises();
    user.state.id = 8;
    state.favourites.deviceOffer = [entry(2)];
    await flushPromises();
    expect(isOpen(wrapper)).toBe(true);
  });

  it('closed without an answer, is not shown again before the next start', async () => {
    state.favourites.deviceOffer = [entry(1)];
    const wrapper = mountPrompt();
    await flushPromises();
    await wrapper.find('.delete').trigger('click');
    state.favourites.deviceOffer = [entry(1), entry(2)];
    await flushPromises();
    expect(isOpen(wrapper)).toBe(false);
  });
});
