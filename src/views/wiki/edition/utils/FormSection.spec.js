import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { compileToFunctions } from 'vue-template-compiler';

import FormSection from './FormSection';

import { formField } from '@/js/form-registration';

// a field as FormField, AssociationsInputRow and MapInputRow are: visible and hasError, registered with the section
const Field = {
  mixins: [formField('formSection')],
  props: { visible: Boolean, hasError: Boolean },
  render: (h) => h('div'),
};

const mountSection = (fields) =>
  mount(
    {
      ...compileToFunctions(`<form-section title="Conditions">
        <div class="columns"><field v-for="field of fields" :key="field.id" v-bind="field" /></div>
      </form-section>`),
      components: { FormSection, Field },
      data: () => ({ fields }),
    },
    { mocks: { $gettext: (s) => s }, stubs: { FaIcon: true, MarkerHelper: true } }
  );

const section = (wrapper) => wrapper.findComponent(FormSection);

describe('FormSection', () => {
  it('is displayed while its fields are mounted (a map inside needs a size)', async () => {
    let displayedOnMount;
    const MapLike = {
      mixins: [formField('formSection')],
      data: () => ({ visible: true, hasError: false }),
      mounted() {
        displayedOnMount = this.$el.closest('.section-item').style.display !== 'none';
      },
      render: (h) => h('div'),
    };

    mount(
      {
        ...compileToFunctions(`<form-section title="Map"><map-like /></form-section>`),
        components: { FormSection, MapLike },
      },
      { mocks: { $gettext: (s) => s }, attachTo: document.body }
    );

    expect(displayedOnMount).toBe(true);
  });

  it('is visible while one of its fields is', async () => {
    const wrapper = mountSection([
      { id: 1, visible: false },
      { id: 2, visible: true },
    ]);
    // the fields register while the section renders: its DOM follows on the next tick, as with the former mounted()
    await wrapper.vm.$nextTick();
    expect(section(wrapper).vm.visible).toBe(true);
    expect(section(wrapper).isVisible()).toBe(true);

    wrapper.vm.fields[1].visible = false;
    await wrapper.vm.$nextTick();

    expect(section(wrapper).vm.visible).toBe(false);
    expect(section(wrapper).isVisible()).toBe(false);
  });

  it('shows when one of its fields has an error', async () => {
    const wrapper = mountSection([{ id: 1, visible: true, hasError: false }]);
    expect(section(wrapper).vm.hasError).toBe(false);

    wrapper.vm.fields[0].hasError = true;
    await wrapper.vm.$nextTick();

    expect(section(wrapper).vm.hasError).toBe(true);
  });

  it('forgets the fields removed from it', async () => {
    const wrapper = mountSection([
      { id: 1, visible: true },
      { id: 2, visible: false },
    ]);

    wrapper.vm.fields.splice(0, 1);
    await wrapper.vm.$nextTick();

    expect(section(wrapper).vm.formFields).toHaveLength(1);
    expect(section(wrapper).vm.visible).toBe(false);
  });
});
