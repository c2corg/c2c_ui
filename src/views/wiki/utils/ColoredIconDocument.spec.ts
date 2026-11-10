// The document type icons of the history lists, on a background of their type's color
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ColoredIconDocument from './ColoredIconDocument.vue';

const background = (documentType: string) =>
  mount(ColoredIconDocument, { props: { documentType }, global: { stubs: { IconDocument: true } } }).find('span')
    .element.style.background;

describe('ColoredIconDocument', () => {
  it('has the color of its document type', () => {
    expect(background('route')).toBe('dodgerblue');
    expect(background('xreport')).toBe('tomato');
  });

  it('is black for the other types', () => {
    expect(background('user')).toBe('black');
  });
});
