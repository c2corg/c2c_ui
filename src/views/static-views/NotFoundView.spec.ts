import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import NotFoundView from './NotFoundView.vue';

// a router-link showing its text and target
const RouterLink = defineComponent({
  props: { to: { type: [String, Object], required: true } },
  setup(props, { slots }) {
    return () => h('a', { 'data-to': JSON.stringify(props.to) }, slots.default?.());
  },
});

describe('NotFoundView', () => {
  it('links to the home and to each document list, with its name', () => {
    const wrapper = mount(NotFoundView, {
      global: {
        components: { RouterLink },
        config: {
          globalProperties: {
            $gettext: (text: string) => text,
            $filters: { uppercaseFirstLetter: (text: string) => text },
          } as never,
        },
        directives: { translate: {} },
      },
    });

    const links = wrapper.findAll('a[data-to]').map((link) => [JSON.parse(link.attributes('data-to')!), link.text()]);
    expect(links).toEqual([
      [{ name: 'home' }, 'Home'],
      ['outings', 'outings'],
      ['waypoints', 'waypoints'],
      ['routes', 'routes'],
      // was named "routes"
      ['articles', 'articles'],
      ['books', 'books'],
      ['xreports', 'xreports'],
      ['images', 'images'],
      ['areas', 'areas'],
    ]);
  });
});
