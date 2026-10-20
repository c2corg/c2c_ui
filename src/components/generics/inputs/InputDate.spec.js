import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import InputDate from './InputDate';

describe('InputDate', () => {
  it('is a native date input showing the value', () => {
    const input = mount(InputDate, { propsData: { value: '2026-10-01' } }).find('input');

    expect(input.attributes('type')).toBe('date');
    expect(input.element.value).toBe('2026-10-01');
    expect(input.classes()).toContain('input');
  });

  it('emits the chosen date as YYYY-MM-DD, and null once cleared', async () => {
    const wrapper = mount(InputDate, { propsData: { value: null } });
    const input = wrapper.find('input');

    await input.setValue('2026-07-14');
    input.element.value = '';
    await input.trigger('input');

    expect(wrapper.emitted('input')).toEqual([['2026-07-14'], [null]]);
  });

  it('limits the selectable dates, and shows errors', () => {
    const input = mount(InputDate, {
      propsData: { value: null, min: '2026-10-01', max: '2026-10-19', required: true, hasError: true },
    }).find('input');

    expect(input.attributes()).toMatchObject({ min: '2026-10-01', max: '2026-10-19', required: 'required' });
    expect(input.classes()).toContain('is-danger');
  });
});

describe('FormInput date limits', async () => {
  const { default: FormInput } = await import('@/views/wiki/edition/utils/FormInput');
  const { dateMin, dateMax } = FormInput.computed;

  it('passes the min and max of the outing form as inclusive YYYY-MM-DD limits', () => {
    // OutingEditionView: date_end can't be before date_start, nor after today
    const field = { name: 'date_end' };
    expect(dateMin.call({ min: '2026-10-01', field })).toBe('2026-10-01');
    expect(dateMax.call({ max: '2026-10-19T08:00:00', field })).toBe('2026-10-19');
    expect(dateMin.call({ field })).toBe(undefined);
    expect(dateMax.call({ field })).toBe(undefined);
  });
});
