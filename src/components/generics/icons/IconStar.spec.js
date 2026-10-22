import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import IconStar from './IconStar';

// IconStar's template starts with a comment: templates are compiled without comments, as in production, so that its
// root stays one element, which inherits the attributes of the parent (a comment would make it a fragment)
describe('IconStar', () => {
  it('passes the class of the parent to its icon', () => {
    const wrapper = mount(IconStar, {
      attrs: { class: 'has-text-warning' },
      global: { stubs: { FaIcon: { template: '<svg class="fa" />' } } },
    });

    expect(wrapper.find('svg').classes()).toEqual(['fa', 'has-text-warning']);
  });
});
