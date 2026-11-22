import { shallowMount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SettingsView from './SettingsView.vue';

import c2c from '@/js/apis/c2c';

vi.mock('@/js/composables/head', () => ({ useNoRobots: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const mountView = (preferences: object | null, isLogged = true) => {
  const get = vi.spyOn(c2c.userProfile.preferences, 'get').mockReturnValue({ data: preferences } as never);
  const wrapper = shallowMount(SettingsView, {
    global: {
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $language: { availableUI: { fr: 'Français', en: 'English' }, current: 'fr', setCurrent: vi.fn() },
          $user: { isLogged },
          $route: { fullPath: '/settings' },
        } as never,
      },
      stubs: [
        'input-activity',
        'input-document',
        'document-card',
        'input-checkbox',
        'loading-notification',
        'html-header',
        'fa-icon',
        'router-link',
      ],
    },
  });
  return { wrapper, get };
};

describe('SettingsView', () => {
  beforeEach(() => setActivePinia(createPinia()));
  afterEach(() => vi.restoreAllMocks());

  // the lists use them too, whatever the feed shows
  it('shows the activities and the areas when the feed shows only the followed users', () => {
    const { wrapper } = mountView({
      followed_only: true,
      langs: [],
      activities: ['hiking'],
      areas: [{ document_id: 14 }],
    });

    expect(wrapper.find('input-activity-stub').exists()).toBe(true);
    expect(wrapper.findAll('document-card-stub')).toHaveLength(1);
    expect(wrapper.text()).not.toContain('Languages of the feed');
  });

  it('shows the languages of the feed when it is not limited to the followed users', () => {
    const { wrapper } = mountView({ followed_only: false, langs: ['fr'], activities: [], areas: [] });

    expect(wrapper.text()).toContain('Languages of the feed');
    expect(wrapper.find('input-activity-stub').exists()).toBe(true);
  });

  // the device part works for anyone; the account part asks to log in, without reading the preferences
  it('shows the settings of the device to a visitor, and asks to log in for the rest', () => {
    const { wrapper, get } = mountView(null, false);

    expect(get).not.toHaveBeenCalled();
    expect(wrapper.find('#device').exists()).toBe(true);
    expect(wrapper.find('input-activity-stub').exists()).toBe(false);
    expect(wrapper.text()).toContain('log in to choose them');
  });

  // what the activities and areas are for, said to everyone
  it('explains what the activities and the areas are used for', () => {
    const { wrapper } = mountView(null, false);

    expect(wrapper.find('.uses').text()).toContain('My preferences');
  });
});
