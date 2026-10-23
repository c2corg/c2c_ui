import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import InputRadioButton from '@/components/generics/inputs/InputRadioButton';
import InputSlider from '@/components/generics/inputs/InputSlider';
import LayerButton from '@/components/yeti/LayerButton';
import YetiSlider from '@/components/yeti/Slider';
import DisplayModeSwitch from '@/views/documents/utils/DisplayModeSwitch';
import UserFormField from '@/views/user/utils/FormField';
import InputConditionsLevels from '@/views/wiki/edition/utils/InputConditionsLevels';

const global = {
  mocks: { $gettext: (text) => text, $filters: { uppercaseFirstLetter: (text) => text }, $screen: {} },
  stubs: { FaIcon: true, DropdownButton: { template: '<div><slot name="button" /><slot /></div>' } },
  components: { InputSlider },
  directives: { translate: {} },
};

// the component in a parent, bound with v-model: it shows the parent value, and the parent gets the value chosen in it
const mountWithVModel = (component, value, attrs = '') =>
  mount(
    {
      components: { TheComponent: component },
      template: `<the-component v-model="value" ${attrs} />`,
      data: () => ({ value }),
    },
    { global, attachTo: document.body }
  );

describe('v-model components', () => {
  it('InputRadioButton', async () => {
    const options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ];
    const wrapper = mountWithVModel(InputRadioButton, 'a', `:options='${JSON.stringify(options)}'`);
    const radios = wrapper.findAll('input[type=radio]');
    expect(radios.map((radio) => radio.element.checked)).toEqual([true, false]);

    await radios[1].setValue(true);
    expect(wrapper.vm.value).toBe('b');

    wrapper.vm.value = 'a';
    await nextTick();
    expect(radios[0].element.checked).toBe(true);
  });

  it('InputSlider', async () => {
    const wrapper = mountWithVModel(InputSlider, [100, 3000], ':max="9000" :step="25" :lazy="false"');
    const handles = wrapper.findAll('[role=slider]');
    expect(handles.map((handle) => handle.attributes('aria-valuenow'))).toEqual(['100.0', '3000.0']);

    await handles[0].trigger('keydown', { key: 'ArrowRight' });
    expect(wrapper.vm.value).toEqual([125, 3000]);
  });

  it('Yeti Slider', async () => {
    const wrapper = mountWithVModel(YetiSlider, 0.5, ':min="0" :max="1" :interval="0.1"');

    await wrapper.find('[role=slider]').trigger('keydown', { key: 'ArrowRight' });
    expect(wrapper.vm.value).toBe(0.6);
  });

  it('Yeti LayerButton, as a checkbox', async () => {
    const wrapper = mountWithVModel(LayerButton, false);
    const checkbox = wrapper.find('input[type=checkbox]');

    await checkbox.setValue(true);
    expect(wrapper.vm.value).toBe(true);

    wrapper.vm.value = false;
    await nextTick();
    expect(checkbox.element.checked).toBe(false);
  });

  it('Yeti LayerButton, as a radio of base layers', async () => {
    const layers = [{ title: 'a' }, { title: 'b' }];
    const wrapper = mount(
      {
        components: { LayerButton },
        template: `<div><layer-button v-for="layer of layers" :key="layer.title" type="radio" name="base" v-model="selected" :model="layer" /></div>`,
        data: () => ({ layers, selected: layers[0] }),
      },
      { global, attachTo: document.body }
    );
    const radios = wrapper.findAll('input[type=radio]');
    expect(radios.map((radio) => radio.element.checked)).toEqual([true, false]);

    await radios[1].setValue(true);
    expect(wrapper.vm.selected.title).toBe('b');
  });

  it('DisplayModeSwitch', async () => {
    const wrapper = mountWithVModel(DisplayModeSwitch, 'both', 'list-mode="listMode"');
    const items = wrapper.findAll('.dropdown-item');
    expect(items.filter((item) => item.classes('is-active'))).toHaveLength(1);

    await items[0].trigger('click');
    expect(wrapper.vm.value).toBe('result');
  });

  it('user FormField', async () => {
    const wrapper = mountWithVModel(UserFormField, 'alice', 'name="username" label="Username" icon="user"');
    const input = wrapper.find('input');
    expect(input.element.value).toBe('alice');

    await input.setValue('bob');
    expect(wrapper.vm.value).toBe('bob');
  });

  it('InputConditionsLevels', async () => {
    const levels = JSON.stringify([
      { level_place: 'col', level_snow_height_soft: '', level_snow_height_total: '', level_comment: '' },
    ]);
    const wrapper = mountWithVModel(InputConditionsLevels, levels);
    const place = wrapper.find('input');
    expect(place.element.value).toBe('col');

    await place.setValue('summit'); // v-model.lazy: on change
    expect(JSON.parse(wrapper.vm.value)[0].level_place).toBe('summit');
  });
});
