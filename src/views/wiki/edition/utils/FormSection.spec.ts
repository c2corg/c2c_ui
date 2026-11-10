import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, reactive } from 'vue';

import FormSection from './FormSection.vue';

import { useFormField } from '@/js/composables/form-registration';

// a field as FormField, AssociationsInputRow and MapInputRow are: visible and hasError, registered with the section
const Field = {
  props: { visible: Boolean, hasError: Boolean },
  setup(props: { visible: boolean; hasError: boolean }) {
    useFormField('formSection', props);
  },
  render: () => h('div'),
};

type TestField = { id: number; visible: boolean; hasError?: boolean };

// the test page, its fields changed by the tests
type Page = { fields: TestField[] };

const mountSection = (fields: TestField[]) =>
  mount(
    {
      template: `<form-section title="Conditions">
        <div class="columns"><field v-for="field of fields" :key="field.id" v-bind="field" /></div>
      </form-section>`,
      components: { FormSection, Field },
      data: () => ({ fields }),
    },
    // attached: isVisible() reads the computed style, which needs the element in the document
    {
      attachTo: document.body,
      global: { mocks: { $gettext: (s: string) => s }, stubs: { FaIcon: true, MarkerHelper: true } },
    }
  ) as unknown as VueWrapper<Page>;

// its visible, hasError and formFields read as the template does
const section = (wrapper: VueWrapper) =>
  wrapper.findComponent(FormSection) as unknown as VueWrapper<{
    visible: boolean;
    hasError: boolean;
    formFields: unknown[];
  }>;

describe('FormSection', () => {
  it('is displayed while its fields are mounted (a map inside needs a size)', async () => {
    let displayedOnMount: boolean | undefined;
    const MapLike = {
      setup() {
        useFormField('formSection', reactive({ visible: true, hasError: false }));
      },
      mounted(this: { $el: HTMLElement }) {
        displayedOnMount = (this.$el.closest('.section-item') as HTMLElement).style.display !== 'none';
      },
      render: () => h('div'),
    };

    mount(
      {
        template: `<form-section title="Map"><map-like /></form-section>`,
        components: { FormSection, MapLike },
      },
      { global: { mocks: { $gettext: (s: string) => s } }, attachTo: document.body }
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
