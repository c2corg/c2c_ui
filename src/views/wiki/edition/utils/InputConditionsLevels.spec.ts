import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import InputConditionsLevels from './InputConditionsLevels.vue';

const mountLevels = (modelValue: string | null) =>
  mount(InputConditionsLevels, {
    props: { modelValue },
    global: { directives: { translate: {} }, stubs: { DeleteButton: true } },
  });

const rows = (wrapper: ReturnType<typeof mountLevels>) => wrapper.findAll('tr').slice(1);

describe('InputConditionsLevels', () => {
  it('lists the filled levels, then an empty one', () => {
    const wrapper = mountLevels(JSON.stringify([{ level_place: 'col' }, {}, { level_comment: 'crust' }]));

    expect(rows(wrapper).map((row) => (row.find('input').element as HTMLInputElement).value)).toEqual(['col', '', '']);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('adds an empty level once the last one is filled, and emits the filled levels', async () => {
    const wrapper = mountLevels(null);

    await rows(wrapper)[0].find('input').setValue('summit');

    expect(rows(wrapper)).toHaveLength(2);
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([JSON.stringify([{ level_place: 'summit' }])]);
  });
});
