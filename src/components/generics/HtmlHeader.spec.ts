import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import HtmlHeader from './HtmlHeader.vue';

afterEach(() => {
  vi.doUnmock('@/js/environment-label');
});

describe('HtmlHeader', () => {
  it('sets the page title, and renders nothing', async () => {
    const wrapper = mount(HtmlHeader, { props: { title: 'arête des Cosmiques' } });
    expect(document.title).toBe('Arête des Cosmiques - Camptocamp.org');
    expect(wrapper.text()).toBe('');

    await wrapper.setProps({ title: 'Camptocamp.org' });
    expect(document.title).toBe('Camptocamp.org');
  });

  it('prefixes the title with the environment, if any', async () => {
    vi.resetModules();
    vi.doMock('@/js/environment-label', () => ({ environmentLabel: 'preprod' }));
    const { default: PreprodHeader } = await import('./HtmlHeader.vue');
    mount(PreprodHeader, { props: { title: 'Camptocamp.org' } });
    expect(document.title).toBe('[PREPROD] Camptocamp.org');
  });
});
