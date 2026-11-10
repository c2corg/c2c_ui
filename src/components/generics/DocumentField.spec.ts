import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DocumentField from './DocumentField.vue';

const fieldText = (field: { name: string; prefix?: string; unit?: string }, document: Record<string, unknown>) =>
  mount(DocumentField, { props: { document, field: field as never } }).element.textContent;

describe('DocumentField', () => {
  it('shows a prefix right before the value', () => {
    expect(fieldText({ name: 'fnumber', prefix: 'f/' }, { fnumber: 2.8 })).toBe('f/2.8');
  });

  it('shows a unit after the value and a single non-breaking space', () => {
    expect(fieldText({ name: 'focal_length', unit: 'mm' }, { focal_length: 25 })).toBe('25 mm');
  });

  it('shows a value without prefix nor unit alone', () => {
    expect(fieldText({ name: 'camera_name' }, { camera_name: 'TG-7' })).toBe('TG-7');
  });
});
