import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import HtmlHeader from './HtmlHeader.vue';

describe('HtmlHeader', () => {
  it('sets the page title, and renders nothing', async () => {
    const wrapper = mount(HtmlHeader, { props: { title: 'arête des Cosmiques' } });
    expect(document.title).toBe('Arête des Cosmiques - Camptocamp.org');
    expect(wrapper.text()).toBe('');

    await wrapper.setProps({ title: 'Camptocamp.org' });
    expect(document.title).toBe('Camptocamp.org');
  });
});
