import { shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import PreferencesView from './PreferencesView.vue';

import c2c from '@/js/apis/c2c';

vi.mock('@/js/composables/head', () => ({ useNoRobots: vi.fn() }));

const mountView = (preferences: object) => {
  vi.spyOn(c2c.userProfile.preferences, 'get').mockReturnValue({ data: preferences } as never);
  return shallowMount(PreferencesView, {
    global: {
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $filters: { uppercaseFirstLetter: (text: string) => text },
          $language: { availableUI: { fr: 'Français', en: 'English' }, current: 'fr', setCurrent: vi.fn() },
        } as never,
      },
      directives: { translate: {} },
      stubs: [
        'input-activity',
        'input-document',
        'document-card',
        'input-checkbox',
        'loading-notification',
        'html-header',
      ],
    },
  });
};

describe('PreferencesView', () => {
  afterEach(() => vi.restoreAllMocks());

  // the lists use them too, whatever the feed shows
  it('shows the activities and the areas when the feed shows only the followed users', () => {
    const wrapper = mountView({ followed_only: true, langs: [], activities: ['hiking'], areas: [{ document_id: 14 }] });

    expect(wrapper.find('input-activity-stub').exists()).toBe(true);
    expect(wrapper.findAll('document-card-stub')).toHaveLength(1);
    expect(wrapper.text()).not.toContain('langs');
  });

  it('shows the languages of the feed when it is not limited to the followed users', () => {
    const wrapper = mountView({ followed_only: false, langs: ['fr'], activities: [], areas: [] });

    expect(wrapper.text()).toContain('langs');
    expect(wrapper.find('input-activity-stub').exists()).toBe(true);
  });
});
