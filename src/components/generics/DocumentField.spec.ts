import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DocumentField from './DocumentField.vue';

const fieldText = (
  field: { name: string; prefix?: string; unit?: string },
  document: Record<string, unknown>,
  props: { divisor?: number; unit?: string } = {}
) =>
  mount(DocumentField, {
    props: { document, field: field as never, ...props },
    global: { config: { globalProperties: { $language: { current: 'fr' } } as never } },
  }).element.textContent;

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

  it('shows a length in metres under 1 km, with a decimal under 10 km, in whole km above', () => {
    const field = { name: 'route_length' };
    const km = { divisor: 1000, unit: 'km' };

    expect(fieldText(field, { route_length: 560 }, km)).toBe('560\u00a0m');
    expect(fieldText(field, { route_length: 4520 }, km)).toBe('4,5\u00a0km');
    expect(fieldText(field, { route_length: 12300 }, km)).toBe('12\u00a0km');
  });

  it('rounds other divided values', () => {
    expect(fieldText({ name: 'file_size' }, { file_size: 3000 }, { divisor: 1024, unit: 'ko' })).toBe('3\u00a0ko');
  });
});
