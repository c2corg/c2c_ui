import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SourceBadge from './SourceBadge.vue';

describe('SourceBadge', () => {
  it('shows the short label of a known source', () => {
    const wrapper = shallowMount(SourceBadge, { props: { source: 'skitour', title: 'Skitour.fr' } });
    expect(wrapper.text()).toBe('Skitour');
    expect(wrapper.classes()).toContain('source-badge--skitour');
    expect(wrapper.attributes('title')).toBe('Skitour.fr');
  });

  it.each([
    ['gipfelbuch', 'Gipfelbuch'],
    ['bivouak', 'Bivouak'],
    ['skitourenportal', 'Skitourenportal'],
    ['onice', 'On-Ice'],
  ])('has its own label and colour for %s', (source, label) => {
    const wrapper = shallowMount(SourceBadge, { props: { source, siteName: 'ignored' } });
    expect(wrapper.text()).toBe(label);
    expect(wrapper.classes()).toContain(`source-badge--${source}`);
  });

  it('shows the site name of an unknown source, with a neutral colour', () => {
    const wrapper = shallowMount(SourceBadge, { props: { source: 'newsite', siteName: 'New Site' } });
    expect(wrapper.text()).toBe('New Site');
    expect(wrapper.classes()).toContain('source-badge--other');
  });

  it('shows the id of an unknown source without a site name', () => {
    const wrapper = shallowMount(SourceBadge, { props: { source: 'newsite' } });
    expect(wrapper.text()).toBe('newsite');
    expect(wrapper.classes()).toContain('source-badge--other');
  });
});
