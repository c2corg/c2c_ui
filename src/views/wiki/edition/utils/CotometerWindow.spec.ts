import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CotometerWindow from './CotometerWindow.vue';

import ModalCard from '@/components/generics/modals/ModalCard.vue';

const mountCotometer = () =>
  mount(CotometerWindow, {
    global: {
      components: { ModalCard },
      directives: { translate: {} },
      config: { globalProperties: { $gettext: (text: string) => text } as never },
    },
  });

describe('CotometerWindow', () => {
  it('opens through its exposed show()', async () => {
    const wrapper = mountCotometer();
    expect(wrapper.find('.modal').classes()).not.toContain('is-active');

    (wrapper.vm as unknown as { show(): void }).show();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.modal').classes()).toContain('is-active');
  });

  it.each([
    // skiability index, slope, elevation, rating
    [0, '15', '300', '1.1'],
    [0, '30', '500', '2.1'],
    [1, '38', '800', '3.2'],
    [2, '50', '1000', '5.5'],
  ])('rates a ski route of skiability %s, %s°, %sm as %s', async (skiability, slope, elevation, rating) => {
    const wrapper = mountCotometer();

    await wrapper.findAll('input[type=radio]')[skiability].setValue();
    const [slopeInput, elevationInput] = wrapper.findAll('input[type=number]');
    await slopeInput.setValue(slope);
    await elevationInput.setValue(elevation);

    expect(wrapper.find('h1 .has-text-success').text()).toBe(rating);

    await wrapper.find('button.is-success').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[rating]]);
  });

  it('rates nothing, and shows why, out of the bounds', async () => {
    const wrapper = mountCotometer();
    const [slopeInput, elevationInput] = wrapper.findAll('input[type=number]');

    await slopeInput.setValue('85');
    await elevationInput.setValue('20');

    expect(wrapper.findAll('.help.is-danger')).toHaveLength(2);
    expect(wrapper.find('h1').exists()).toBe(false);
    expect(wrapper.find('button.is-success').attributes()).toHaveProperty('disabled');
  });
});
