import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import install, { stripMarkdown, uppercaseFirstLetter } from './filters';

describe('filters', () => {
  it('upper-cases the first letter only', () => {
    expect(uppercaseFirstLetter('itinéraire de ski')).toBe('Itinéraire de ski');
    expect(uppercaseFirstLetter('éboulis')).toBe('Éboulis');
    expect(uppercaseFirstLetter('AD')).toBe('AD');
    expect(uppercaseFirstLetter('')).toBe('');
  });

  it('strips markdown', () => {
    expect(stripMarkdown('**Bold** and [a link](https://example.org)')).toBe('Bold and a link');
  });

  it('is available in templates as $filters', () => {
    const component = {
      template: `<p>{{ $filters.uppercaseFirstLetter(title) }} - {{ $filters.stripMarkdown(summary) }}</p>`,
    };

    const wrapper = mount(
      { ...component, data: () => ({ title: 'sommet', summary: '_Belle_ course' }) },
      { global: { plugins: [install] } }
    );

    expect(wrapper.text()).toBe('Sommet - Belle course');
  });
});
