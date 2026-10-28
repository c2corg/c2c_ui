import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';

import Yetix from './yetix';
import type { SelectorLayer } from './yetix-types';

const layer = (title: string) => ({ title }) as SelectorLayer;

// a component reading the selectors, as SubPanelLayers does
const watchSelectors = () =>
  mount(
    defineComponent({
      computed: {
        yetiTitles: () => Yetix.yetiLayersSelector.map((layer) => layer.title ?? null),
        overlayTitles: () => Yetix.overlaysLayersSelector.map((layer) => layer.title ?? null),
      },
      render: () => h('div'),
    })
  ).vm;

describe('Yetix layers selectors', () => {
  it('puts each yeti layer at its index, whatever the order they are added in', async () => {
    const vm = watchSelectors();

    Yetix.addLayerToYetiLayersSelector(layer('danger'), 2);
    await nextTick();
    expect(vm.yetiTitles).toEqual([null, null, 'danger']);

    Yetix.addLayerToYetiLayersSelector(layer('slopes'), 0);
    Yetix.addLayerToYetiLayersSelector(layer('areas'), 1);
    await nextTick();
    expect(vm.yetiTitles).toEqual(['slopes', 'areas', 'danger']);
  });

  it('puts each overlay layer at its index, whatever the order they are added in', async () => {
    const vm = watchSelectors();

    Yetix.addLayerToOverlaysLayersSelector(layer('winter-route'), 1);
    await nextTick();
    expect(vm.overlayTitles).toEqual([null, 'winter-route']);

    Yetix.addLayerToOverlaysLayersSelector(layer('protection-areas'), 0);
    await nextTick();
    expect(vm.overlayTitles).toEqual(['protection-areas', 'winter-route']);
  });
});
