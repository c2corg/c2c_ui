import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createApp } from 'vue';

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

  it('formats numbers and lengths in the current language, read when called', () => {
    const app = createApp({});
    app.use(install);
    const globals = app.config.globalProperties;
    globals.$language = { current: 'de' } as never;

    expect(globals.$filters.number(4808)).toBe('4808');
    expect(globals.$filters.number(1.5, { maximumFractionDigits: 1 })).toBe('1,5');
    expect(globals.$filters.number(null)).toBe('');
    expect(globals.$filters.length(4520)).toBe('4,5\u00a0km');

    globals.$language = { current: 'en' } as never;
    expect(globals.$filters.number(1.5, { maximumFractionDigits: 1 })).toBe('1.5');
    expect(globals.$filters.length(560)).toBe('560\u00a0m');
  });
});
