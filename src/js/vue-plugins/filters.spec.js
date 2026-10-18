import { createLocalVue, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { compileToFunctions } from 'vue-template-compiler';

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
    const localVue = createLocalVue();
    localVue.use(install);
    const component = compileToFunctions(
      `<p>{{ $filters.uppercaseFirstLetter(title) }} - {{ $filters.stripMarkdown(summary) }}</p>`
    );

    const wrapper = mount({ ...component, data: () => ({ title: 'sommet', summary: '_Belle_ course' }) }, { localVue });

    expect(wrapper.text()).toBe('Sommet - Belle course');
  });
});
