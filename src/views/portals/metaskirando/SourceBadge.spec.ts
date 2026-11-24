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

  it('shows the name of another source, with a neutral colour', () => {
    const wrapper = shallowMount(SourceBadge, { props: { source: 'gipfelbuch' } });
    expect(wrapper.text()).toBe('gipfelbuch');
    expect(wrapper.classes()).toContain('source-badge--other');
  });
});
