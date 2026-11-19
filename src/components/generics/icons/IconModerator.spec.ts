import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import IconModerator from './IconModerator.vue';

describe('IconModerator', () => {
  it('says what the broom means when the mouse is over it', () => {
    const wrapper = mount(IconModerator, {
      global: {
        mocks: { $gettext: (text: string) => `translated ${text}` },
        stubs: {
          FaIcon: { props: ['icon', 'title'], template: '<svg :data-icon="icon"><title>{{ title }}</title></svg>' },
        },
      },
    });

    expect(wrapper.find('svg').attributes('data-icon')).toBe('broom');
    expect(wrapper.find('title').text()).toBe('translated Topoguide moderator');
  });
});
