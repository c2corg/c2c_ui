// the map and Itinévert components moved to <script setup lang="ts">: what their scripts do
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import DropdownButton from './generics/DropdownButton.vue';
import ItinevertFilterView from './itinevert/ItinevertFilterView.vue';
import ItinevertLoadingView from './itinevert/ItinevertLoadingView.vue';
import ItinevertPageSelector from './itinevert/ItinevertPageSelector.vue';
import BiodivInformation from './map/BiodivInformation.vue';
import GpsFileUpload from './map/GpsFileUpload.vue';
import LayerButton from './map/LayerButton.vue';
import SwissProtectionAreaInformation from './map/SwissProtectionAreaInformation.vue';

import { MAX_ROUTE_THRESHOLD } from '@/js/apis/itinevert-service';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const globalProperties = {
  $gettext: (text: string) => text,
  $language: { current: 'de' },
  $filters: { uppercaseFirstLetter: (text: string) => text },
  $dateUtils: {
    month: (index: number) => MONTHS[index],
    // one run of months, possibly across the new year
    hasSinglePeriod: (period: boolean[]) => {
      const runs = period.map(Number).join('').split(/0+/).filter(Boolean).length;
      return runs <= 1 || (runs === 2 && period[0] && period[11]);
    },
  },
};
const ModalWindow = defineComponent({
  name: 'ModalWindow',
  setup: (_, { expose, slots }) => {
    expose({ show() {} });
    return () => h('div', [slots.header?.(), slots.default?.()]);
  },
});
const InputSlider = defineComponent({
  name: 'InputSlider',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup: () => () => h('i'),
});
const global = {
  config: { globalProperties: globalProperties as never },
  components: { ModalWindow, InputSlider },
  stubs: { FaIcon: true },
  directives: { translate: {} },
};

describe('ItinevertLoadingView', () => {
  it('shows the progress in percent', () => {
    const percent = (progress: number, total: number) =>
      mount(ItinevertLoadingView, { props: { progress, total, isSpinner: false }, global }).text();

    expect(percent(5, 20)).toContain('25');
    expect(percent(5, 0)).toContain('0');
  });
});

describe('ItinevertPageSelector', () => {
  it('pages through the documents, and changes the number per page', async () => {
    const wrapper = mount(ItinevertPageSelector, {
      props: { documents: { total: 75 }, offset: 30, limit: 30 },
      global: { ...global, components: { ...global.components, DropdownButton } },
    });
    expect(wrapper.text()).toContain('31-60');

    const [previous, next] = wrapper.findAll('.pagination-link:not(.is-disabled)');
    await previous.trigger('click');
    await next.trigger('click');
    await wrapper.findAll('.dropdown-item')[2].trigger('click');

    expect(wrapper.emitted('paginate')).toEqual([[[0, 30]], [[60, 30]], [[30, 100]]]);
  });
});

describe('ItinevertFilterView', () => {
  it('counts the routes, and allows the results under the maximum', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { render: () => null } }],
    });
    await router.push('/?act=skitouring');
    const wrapper = mount(ItinevertFilterView, {
      props: { filteredRoutes: { total: MAX_ROUTE_THRESHOLD + 1 } },
      global: { ...global, plugins: [router], stubs: { ...global.stubs, QueryItem: true, DropdownButton: true } },
    });
    const showResults = () => wrapper.findAll('.filter-buttons button')[1];

    expect(wrapper.text().replace(/\s+/g, ' ')).toContain(`${MAX_ROUTE_THRESHOLD + 1} / ${MAX_ROUTE_THRESHOLD} routes`);
    expect(showResults().attributes('disabled')).toBeDefined();

    await wrapper.setProps({ filteredRoutes: { total: 12 } });
    expect(showResults().attributes('disabled')).toBeUndefined();
    await showResults().trigger('click');
    expect(wrapper.emitted('computeJourneyReachableRoutes')).toHaveLength(1);
  });
});

describe('BiodivInformation', () => {
  const periodOf = (period: boolean[]) =>
    mount(BiodivInformation, {
      props: { data: { name: 'Zone', description: 'a<br>b &amp; c', period } },
      global,
    }).text();
  const months = (...indexes: number[]) => MONTHS.map((_, index) => indexes.includes(index));

  it('shows the period, across the new year too', () => {
    expect(periodOf(months(...MONTHS.map((_, index) => index)))).toContain('whole year');
    expect(periodOf(months(11, 0, 1))).toContain('dec to feb');
    expect(periodOf(months(0, 5))).toContain('jan, jun');
  });

  it('decodes the description, a paragraph per line', () => {
    expect(periodOf(months(0))).toContain('b & c');
  });
});

describe('SwissProtectionAreaInformation', () => {
  it('shows the texts in the language of the user, or in French', () => {
    const textOf = (current: string) =>
      mount(SwissProtectionAreaInformation, {
        props: {
          data: {
            layerBodId: 'ch.bafu.wrz-jagdbanngebiete_select',
            properties: { best_de: 'Weggebot', best_fr: 'Obligation de rester sur les chemins' },
          },
        },
        global: { ...global, config: { globalProperties: { ...globalProperties, $language: { current } } as never } },
      }).text();

    expect(textOf('de')).toContain('Fauna protection site:');
    expect(textOf('de')).toContain('Weggebot');
    expect(textOf('en')).toContain('Obligation de rester sur les chemins');
  });
});

describe('GpsFileUpload', () => {
  it('emits the content of the chosen file, and empties the input', async () => {
    const wrapper = mount(GpsFileUpload, { global });
    const input = wrapper.find('input');
    const file = new File(['<gpx />'], 'track.gpx', { type: 'application/gpx+xml' });
    Object.defineProperty(input.element, 'files', { value: [file] });

    await input.trigger('change');
    await vi.waitFor(() => expect(wrapper.emitted('click')).toEqual([['<gpx />']]));
    expect(input.element.value).toBe('');
  });
});

describe('LayerButton', () => {
  it('starts from the opacity of the layer, and changes it', async () => {
    const layer = { values: { opacity: 0.4, configurable: true, image: 'esri.jpg' } as Record<string, unknown> };
    const olLayer = {
      get: (key: string) => layer.values[key],
      set: vi.fn((key: string, value: unknown) => (layer.values[key] = value)),
    };
    const wrapper = mount(LayerButton, { props: { layer: olLayer, selected: true }, global });

    await wrapper.find('.layer-button-config').trigger('click');
    const slider = wrapper.findComponent({ name: 'InputSlider' });
    expect(slider.props('modelValue')).toBe(40);

    slider.vm.$emit('update:modelValue', 70);
    await nextTick();
    expect(olLayer.set).toHaveBeenCalledWith('opacity', 0.7);

    // unselected: the slider closes
    await wrapper.setProps({ selected: false });
    await flushPromises();
    expect(wrapper.findComponent({ name: 'InputSlider' }).exists()).toBe(false);
  });
});

describe('ItinevertWizard', () => {
  it('enables the search once the activity, the mountain range and the start are set', async () => {
    const { default: ItinevertWizard } = await import('./itinevert/ItinevertWizard.vue');
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { render: () => null } }],
    });
    await router.push('/');
    const wrapper = mount(ItinevertWizard, {
      global: {
        ...global,
        plugins: [router],
        stubs: {
          ...global.stubs,
          InputRadioButton: true,
          InputActivity: true,
          InputAddress: true,
          InputAutocomplete: true,
          ItinevertBanner: true,
        },
      },
    });
    const wizard = wrapper.vm as unknown as {
      isSearchEnabled: boolean;
      formData: {
        activities: string[];
        mountainRange: { selected: unknown };
        startingPoint: { selectedAddress: unknown };
      };
    };
    expect(wizard.isSearchEnabled).toBe(false);

    wizard.formData.activities = ['skitouring'];
    wizard.formData.mountainRange.selected = { document_id: 1 };
    expect(wizard.isSearchEnabled).toBe(false);

    wizard.formData.startingPoint.selectedAddress = { geometry: { coordinates: [6, 45] } };
    expect(wizard.isSearchEnabled).toBe(true);
  });
});
