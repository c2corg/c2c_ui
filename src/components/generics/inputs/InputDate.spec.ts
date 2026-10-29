import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import InputDate from './InputDate.vue';

import FormInput from '@/views/wiki/edition/utils/FormInput.vue';

describe('InputDate', () => {
  it('is a native date input showing the value', () => {
    const input = mount(InputDate, { props: { modelValue: '2026-10-01' } }).find('input');

    expect(input.attributes('type')).toBe('date');
    expect((input.element as HTMLInputElement).value).toBe('2026-10-01');
    expect(input.classes()).toContain('input');
  });

  it('emits the chosen date as YYYY-MM-DD, and null once cleared', async () => {
    const wrapper = mount(InputDate, { props: { modelValue: null } });
    const input = wrapper.find('input');

    await input.setValue('2026-07-14');
    (input.element as HTMLInputElement).value = '';
    await input.trigger('input');

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-07-14'], [null]]);
  });

  it('limits the selectable dates, and shows errors', () => {
    const input = mount(InputDate, {
      props: { modelValue: null, min: '2026-10-01', max: '2026-10-19', required: true, hasError: true },
    }).find('input');

    expect(input.attributes()).toMatchObject({ min: '2026-10-01', max: '2026-10-19' });
    // Vue 3 renders boolean attributes as required="" (Vue 2: required="required")
    expect((input.element as HTMLInputElement).required).toBe(true);
    expect(input.classes()).toContain('is-danger');
  });
});

describe('FormInput date limits', () => {
  // a date field of the outing form, as far as FormInput reads it
  const mountDate = (props: { min?: string; max?: string }) =>
    mount(FormInput, {
      props: {
        field: { name: 'date_end', type: 'date', parent: 'document', error: null, isVisibleFor: () => true } as never,
        document: { type: 'o', locales: [{ lang: 'fr' }], date_end: null },
        ...props,
      },
      // a global component of the app
      global: { components: { InputDate } },
    }).findComponent(InputDate);

  it('passes the min and max of the outing form as inclusive YYYY-MM-DD limits', () => {
    // OutingEditionView: date_end can't be before date_start, nor after today
    expect(mountDate({ min: '2026-10-01', max: '2026-10-19T08:00:00' }).props()).toMatchObject({
      min: '2026-10-01',
      max: '2026-10-19',
    });
    expect(mountDate({}).props()).toMatchObject({ min: undefined, max: undefined });
  });
});
