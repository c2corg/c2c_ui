import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import LoadUserPreferencesButton from './LoadUserPreferencesButton.vue';

import c2c from '@/js/apis/c2c';
import { toast } from '@/js/toast';

vi.mock('@/js/toast', () => ({ toast: vi.fn() }));

const mountButton = async (url: string, preferences: object, display: 'button' | 'dropdown' = 'button') => {
  vi.spyOn(c2c.userProfile.preferences, 'get').mockResolvedValue({ data: preferences } as never);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['outings', 'books', 'waypoints', 'preferences'].map((name) => ({
      path: '/' + name,
      name,
      component: { render: () => null },
    })),
  });
  await router.push(url);
  const wrapper = mount(LoadUserPreferencesButton, {
    props: { display },
    global: {
      plugins: [router],
      config: { globalProperties: { $gettext: (text: string) => text, $user: { isLogged: true } } as never },
      directives: { translate: {} },
      stubs: { FaIcon: { props: ['icon'], template: '<i :data-icon="icon" />' } },
    },
  });
  return { wrapper, router };
};

const click = async (wrapper: Awaited<ReturnType<typeof mountButton>>['wrapper']) => {
  await wrapper.find('button, a').trigger('click');
  await flushPromises();
};

describe('LoadUserPreferencesButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(toast).mockClear();
  });

  it('filters the list with the activities and the areas of the user, from the first page', async () => {
    const { wrapper, router } = await mountButton('/outings?bbox=1,2,3,4&offset=30&qa=draft', {
      activities: ['skitouring', 'hiking'],
      areas: [{ document_id: 14 }, { document_id: 15 }],
    });
    await click(wrapper);

    expect(router.currentRoute.value.query).toEqual({ act: 'skitouring,hiking', a: '14,15', qa: 'draft' });
  });

  it('filters the books by activity', async () => {
    const { wrapper, router } = await mountButton('/books', { activities: ['rock_climbing'], areas: [] });
    await click(wrapper);

    expect(router.currentRoute.value.query).toEqual({ act: 'rock_climbing' });
  });

  it('shows when the preferences are applied', async () => {
    const { wrapper } = await mountButton('/waypoints', { activities: [], areas: [{ document_id: 14 }] });
    expect(wrapper.find('[data-icon="check"]').exists()).toBe(false);

    await click(wrapper);
    expect(wrapper.find('[data-icon="check"]').exists()).toBe(true);
    expect(wrapper.find('button').classes()).toContain('is-primary');
  });

  it('tells when the preferences are already applied', async () => {
    const { wrapper, router } = await mountButton('/outings?act=hiking&a=14', {
      activities: ['hiking'],
      areas: [{ document_id: 14 }],
    });
    await click(wrapper);

    expect(router.currentRoute.value.query).toEqual({ act: 'hiking', a: '14' });
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ message: 'Your preferences are already applied.' }));
  });

  it('sends to the preferences page when there are none, without changing the list', async () => {
    const { wrapper, router } = await mountButton('/outings?act=hiking', { activities: [], areas: [] }, 'dropdown');
    await click(wrapper);

    expect(router.currentRoute.value.query).toEqual({ act: 'hiking' });
    const message = vi.mocked(toast).mock.calls[0]![0].message as HTMLElement;
    expect(message.textContent).toContain('You have no activity nor area in your preferences.');
    expect(message.querySelector('a')!.getAttribute('href')).toBe('/preferences');
  });

  it('tells when the preferences cannot be loaded', async () => {
    const { wrapper, router } = await mountButton('/outings', {});
    vi.mocked(c2c.userProfile.preferences.get).mockRejectedValue(new Error('offline'));
    await click(wrapper);

    expect(router.currentRoute.value.query).toEqual({});
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'is-danger' }));
  });
});
