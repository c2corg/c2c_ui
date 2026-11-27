import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import IconModerator from './IconModerator.vue';

import fontAwesome from '@/js/vue-plugins/font-awesome-config';

describe('IconModerator', () => {
  it('says what the broom means when the mouse is over it', () => {
    const wrapper = mount(IconModerator, {
      global: { plugins: [fontAwesome], mocks: { $gettext: (text: string) => `translated ${text}` } },
    });

    expect(wrapper.attributes('title')).toBe('translated Topoguide moderator');
    expect(wrapper.find('svg').attributes('data-icon')).toBe('broom');
  });
});
