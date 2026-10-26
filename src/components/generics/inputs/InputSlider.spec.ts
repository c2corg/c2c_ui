import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import InputSlider from './InputSlider.vue';

import LayerButton from '@/components/map/LayerButton.vue';
import QueryItem from '@/views/documents/utils/QueryItem.vue';

// a component of the Options API, its computed properties and methods called on a test object
type OptionsComponent = {
  computed: Record<string, { get(this: unknown): unknown; set(this: unknown, value: unknown): void }>;
  methods: Record<string, (this: unknown, ...args: unknown[]) => unknown>;
};

const handles = (wrapper: VueWrapper) => wrapper.findAll('[role=slider]');

describe('InputSlider', () => {
  it('shows one handle for a value, two for a range, within its bounds', () => {
    const single = mount(InputSlider, { props: { modelValue: 40 }, attachTo: document.body });
    const range = mount(InputSlider, {
      props: { modelValue: [100, 3000], min: 0, max: 9000, step: 25 },
      attachTo: document.body,
    });

    expect(handles(single)).toHaveLength(1);
    expect(handles(single)[0].attributes('aria-valuenow')).toBe('40.0');
    expect(handles(range)).toHaveLength(2);
    expect(handles(range).map((handle) => handle.attributes('aria-valuenow'))).toEqual(['100.0', '3000.0']);
    // the lower handle can't pass the upper one: its max is the upper value
    expect(handles(range)[0].attributes('aria-valuemax')).toBe('3000.0');
    expect(handles(range)[1].attributes('aria-valuemax')).toBe('9000.0');
  });

  it('moves by its step with the keyboard, and emits the new value', async () => {
    const wrapper = mount(InputSlider, {
      props: { modelValue: [100, 3000], max: 9000, step: 25 },
      attachTo: document.body,
    });

    await handles(wrapper)[0].trigger('keydown', { key: 'ArrowRight' });

    const values = [...(wrapper.emitted('update:modelValue') ?? []), ...(wrapper.emitted('change') ?? [])].map(
      ([value]) => value
    );
    expect(values).toContainEqual([125, 3000]);
  });

  it('labels its handles for assistive technologies', () => {
    const wrapper = mount(InputSlider, {
      props: { modelValue: 1, ariaLabelledby: 'label-1' },
      attachTo: document.body,
    });

    expect(handles(wrapper)[0].attributes('aria-labelledby')).toBe('label-1');
  });
});

describe('QueryItem ratings range', () => {
  const { valueIndexes } = (QueryItem as unknown as OptionsComponent).computed;
  const { formatValueIndex } = (QueryItem as unknown as OptionsComponent).methods;
  const field = { values: ['F', 'F+', 'PD-', 'PD'], i18n: false };

  it('gives the slider the indexes of the selected values, and the values back', () => {
    const item: { field: typeof field; value: string[] } = { field, value: ['F+', 'PD'] };

    expect(valueIndexes.get.call(item)).toEqual([1, 3]);

    valueIndexes.set.call(item, [2, 3]);
    expect(item.value).toEqual(['PD-', 'PD']);
  });

  it('shows the value of an index in the tooltips, translated when the field is', () => {
    expect(formatValueIndex.call({ field }, 2)).toBe('PD-');
    expect(
      formatValueIndex.call({ field: { values: ['good'], i18n: true }, gettext: (key: string) => `[${key}]` }, 0)
    ).toBe('[good]');
  });
});

describe('slider labels', () => {
  const mocks = { $gettext: (key: string) => key, $filters: { uppercaseFirstLetter: (text: string) => text } };
  // the accessible name of a handle: the text of the element its aria-labelledby points to
  const handleName = (wrapper: VueWrapper) =>
    document.getElementById(handles(wrapper)[0].attributes('aria-labelledby') ?? '')?.textContent?.trim();

  // a documents list: QueryItem reads and writes its filter in the URL (useQueryItem)
  const listRouter = async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/routes', name: 'routes', component: { render: () => h('div') } }],
    });
    await router.push('/routes');
    return router;
  };

  it.each([
    ['valuesRangeSlider', { values: ['F', 'PD', 'AD'], urlToValue: () => ['F', 'AD'] }],
    ['numericalRangeSlider', { min: 0, max: 9000, unit: 'm', urlToValue: () => [0, 9000] }],
  ])('names the %s handles after the field', async (queryMode, field) => {
    const wrapper = mount(QueryItem, {
      // a field as far as QueryItem reads it
      props: { field: { queryMode, name: 'Global rating', url: 'grat', ...field } as never },
      global: { plugins: [await listRouter()], mocks, stubs: { InputSlider } },
      attachTo: document.body,
    });

    expect(handleName(wrapper)).toBe('Global rating');
  });

  it('names the map opacity handle after the layer', async () => {
    const props = { title: 'IGN slopes', image: 'ignslopes.jpg', configurable: true, opacity: 0.7 };
    const layer = { get: (key: keyof typeof props) => props[key], set: () => {} };
    const wrapper = mount(LayerButton, {
      props: { layer, selected: true },
      global: { mocks, stubs: { InputSlider, FaIcon: true } },
      attachTo: document.body,
    });

    await wrapper.find('.layer-button-config').trigger('click');

    expect(handleName(wrapper)).toBe('IGN slopes');
  });
});
