// the panels of the yeti portal moved to <script setup lang="ts">: what their scripts do
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';

import DropdownContent from './DropdownContent.vue';
import Info from './Info.vue';
import LayerButton from './LayerButton.vue';
import SubPanelMeteo from './SubPanelMeteo.vue';
import SubPanelMethods from './SubPanelMethods.vue';
import Tabs from './Tabs.vue';
import Yetix from './yetix';
import yetixEvents from './yetix-events';

const globalProperties = {
  $gettext: (text: string) => text,
  $language: { current: 'fr' },
} as never;
const global = { config: { globalProperties }, stubs: { FaIcon: true }, directives: { translate: {} } };

afterEach(() => {
  yetixEvents.all.clear();
  document.body.innerHTML = '';
});

describe('DropdownContent and Info', () => {
  it('opens and closes its content', async () => {
    const wrapper = mount(DropdownContent, { slots: { default: 'Title', content: '<p>Content</p>' }, global });
    expect(wrapper.find('p').exists()).toBe(false);

    await wrapper.find('h3').trigger('click');
    expect(wrapper.find('p').exists()).toBe(true);
  });

  it('shows the icon of its type', () => {
    const FaIcon = defineComponent({ name: 'FaIcon', props: ['icon'], setup: () => () => h('i') });
    const iconOf = (type: string) =>
      mount(Info, { props: { type }, global: { ...global, stubs: { FaIcon } } })
        .findComponent(FaIcon)
        .props('icon');

    expect(iconOf('warning')).toBe('exclamation-circle');
    expect(iconOf('help')).toBe('question-circle');
  });
});

describe('LayerButton', () => {
  it('tells why it is disabled when clicked', async () => {
    const toast = vi.fn();
    const Toast = defineComponent({
      name: 'Toast',
      setup: (_, { expose }) => {
        expose({ toast });
        return () => h('div');
      },
    });
    const wrapper = mount(LayerButton, {
      props: { image: 'unknown.png', disabled: { condition: true, title: 'Zoom in', message: 'Too far' } },
      global: { ...global, stubs: { Toast } },
    });

    await wrapper.trigger('click');

    expect(toast).toHaveBeenCalledTimes(1);
    // an unknown image: no background
    expect(wrapper.find('.layer-image').attributes('style')).toContain('background-image: none');
  });
});

describe('Tabs', () => {
  it('switches to the adjacent tab with the arrow keys', async () => {
    const tabs = [
      { name: 'One', icon: 'a' },
      { name: 'Two', icon: 'b' },
    ];
    Yetix.setActiveTab(0);
    const wrapper = mount(Tabs, { props: { tabs }, global, attachTo: document.body });
    const [first, second] = wrapper.findAll('[role=tab]');

    await first.trigger('keydown', { key: 'ArrowRight' });
    expect(Yetix.activeTab).toBe(1);
    // the active tab gets the focus
    expect(document.activeElement).toBe(second.element);

    // no tab after the last one
    await second.trigger('keydown', { key: 'ArrowRight' });
    expect(Yetix.activeTab).toBe(1);

    await second.trigger('keydown', { key: 'ArrowLeft' });
    expect(Yetix.activeTab).toBe(0);
    wrapper.unmount();
  });
});

describe('SubPanelMeteo', () => {
  it('shows the weather of the point clicked on the map, and stops listening once closed', async () => {
    const wrapper = mount(SubPanelMeteo, { global: { ...global, stubs: { ...global.stubs, SubPanelTitle: true } } });
    expect(wrapper.find('iframe').exists()).toBe(false);

    yetixEvents.emit('lon-lat', { lon: 6.8, lat: 45.9 });
    await nextTick();
    expect(wrapper.find('iframe').attributes('src')).toMatch(
      /^https:\/\/www\.meteoblue\.com\/fr\/weather\/widget\/daily\/45\.9N6\.8E\?/
    );

    wrapper.unmount();
    expect(yetixEvents.all.get('lon-lat') ?? []).toHaveLength(0);
  });
});

describe('SubPanelMethods', () => {
  it('sets the potential danger of the bulletin level', async () => {
    mount(SubPanelMethods, { global: { ...global, stubs: { ...global.stubs, SubPanelTitle: true, Info: true } } });

    Yetix.setBra('high', 3);
    await nextTick();
    expect(Yetix.method.potentialDanger).toBe(8);

    Yetix.setBra('high', 1);
    await nextTick();
    expect(Yetix.method.potentialDanger).toBe(2);
  });
});

describe('SubPanelCourse', () => {
  it('removes the features, and resets the simplify tool', async () => {
    const { default: SubPanelCourse } = await import('./SubPanelCourse.vue');
    const { default: Feature } = await import('ol/Feature');
    const { default: LineString } = await import('ol/geom/LineString');
    Yetix.setFeatures([
      new Feature(
        new LineString([
          [0, 0],
          [1, 1],
        ])
      ),
    ]);
    const initialize = vi.fn();
    const SimplifyTool = defineComponent({
      name: 'SimplifyTool',
      setup: (_, { expose }) => {
        expose({ initialize });
        return () => h('div');
      },
    });
    const removeFeatures = vi.fn();
    yetixEvents.on('removeFeatures', removeFeatures);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const wrapper = mount(SubPanelCourse, {
      global: {
        ...global,
        stubs: {
          ...global.stubs,
          SimplifyTool,
          ElevationProfile: true,
          FeaturesList: true,
          EditModeButton: true,
          SubPanelTitle: true,
          DropdownContent: { template: '<div><slot /><slot name="content" /></div>' },
          Info: true,
        },
      },
    });

    await wrapper.find('button[title="Delete route"]').trigger('click');

    expect(removeFeatures).toHaveBeenCalledTimes(1);
    expect(initialize).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });
});
