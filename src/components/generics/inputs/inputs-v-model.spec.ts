import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, nextTick, type Component } from 'vue';

import InputActivity from './InputActivity.vue';
import InputCheckbox from './InputCheckbox.vue';
import InputDate from './InputDate.vue';
import InputEventActivity from './InputEventActivity.vue';
import InputMultiSelect from './InputMultiSelect.vue';
import InputOrientation from './InputOrientation.vue';
import InputSimple from './InputSimple.vue';
import InputYesNo from './InputYesNo.vue';

const global = {
  mocks: { $gettext: (text: string) => text, $filters: { uppercaseFirstLetter: (text: string) => text } },
  stubs: { IconActivity: true, IconEventActivity: true, FaIcon: true },
};

// the input in a parent, bound with v-model as the forms do: the input shows the parent value, and the parent gets the
// value chosen in the input
const mountWithVModel = (component: Component, value: unknown, attrs = '') =>
  mount(
    defineComponent({
      components: { TheInput: component },
      template: `<the-input v-model="value" ${attrs} />`,
      data: () => ({ value }),
    }),
    { global, attachTo: document.body }
  );

describe('inputs v-model', () => {
  it('InputCheckbox', async () => {
    const wrapper = mountWithVModel(InputCheckbox, false);
    const checkbox = wrapper.find('input[type=checkbox]');
    expect((checkbox.element as HTMLInputElement).checked).toBe(false);

    await checkbox.setValue(true);
    expect(wrapper.vm.value).toBe(true);

    wrapper.vm.value = false;
    await nextTick();
    expect((checkbox.element as HTMLInputElement).checked).toBe(false);
  });

  it('InputYesNo', async () => {
    const wrapper = mountWithVModel(InputYesNo, true, 'nullable');
    const radios = wrapper.findAll('input[type=radio]');
    expect(radios.map((radio) => (radio.element as HTMLInputElement).checked)).toEqual([true, false, false]);

    await radios[1].setValue(true);
    expect(wrapper.vm.value).toBe(false);

    wrapper.vm.value = null;
    await nextTick();
    expect(radios.map((radio) => (radio.element as HTMLInputElement).checked)).toEqual([false, false, true]);
  });

  it('InputSimple, with a divisor', async () => {
    const wrapper = mountWithVModel(InputSimple, 2500, 'type="number" :divisor="1000"');
    const input = wrapper.find('input');
    expect((input.element as HTMLInputElement).value).toBe('2.5');

    await input.setValue('3'); // v-model.lazy: on change
    expect(wrapper.vm.value).toBe(3000);
  });

  it('InputDate', async () => {
    const wrapper = mountWithVModel(InputDate, '2026-10-01');
    const input = wrapper.find('input');
    expect((input.element as HTMLInputElement).value).toBe('2026-10-01');

    await input.setValue('2026-10-05');
    expect(wrapper.vm.value).toBe('2026-10-05');
  });

  it('InputActivity', async () => {
    const wrapper = mountWithVModel(InputActivity, ['hiking']);
    const items = wrapper.findAll('.input-item');
    expect(items.filter((item) => item.attributes('checked') !== undefined)).toHaveLength(1);

    await items[0].trigger('click');
    expect(wrapper.vm.value).toHaveLength(2);
  });

  it('InputEventActivity', async () => {
    const wrapper = mountWithVModel(InputEventActivity, null);

    await wrapper.findAll('.input-item')[0].trigger('click');
    expect(wrapper.vm.value).toBeTypeOf('string');
  });

  it('InputMultiSelect', async () => {
    const wrapper = mountWithVModel(InputMultiSelect, ['b'], `:options="['a', 'b', 'c']"`);

    await wrapper.findAll('.multi-select-item')[0].trigger('click');
    expect(wrapper.vm.value).toEqual(['b', 'a']);
  });

  it('InputOrientation', async () => {
    const wrapper = mountWithVModel(InputOrientation, ['N']);
    expect(wrapper.find('.input-orientation-selected text').text()).toBe('N');

    await wrapper.find('g').trigger('click'); // E
    expect(wrapper.vm.value).toEqual(['N', 'E']);
  });
});
