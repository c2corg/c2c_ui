import { describe, expect, it } from 'vitest';
import Vue, { nextTick } from 'vue';

import Yetix from './Yetix';

// a component reading the selectors, as SubPanelLayers does
const watchSelectors = () =>
  new Vue({
    computed: {
      yetiTitles: () => Yetix.yetiLayersSelector.map((layer) => layer.title ?? null),
      overlayTitles: () => Yetix.overlaysLayersSelector.map((layer) => layer.title ?? null),
    },
    render: (h) => h('div'),
  }).$mount();

describe('Yetix layers selectors', () => {
  it('puts each yeti layer at its index, whatever the order they are added in', async () => {
    const vm = watchSelectors();

    Yetix.addLayerToYetiLayersSelector({ title: 'danger' }, 2);
    await nextTick();
    expect(vm.yetiTitles).toEqual([null, null, 'danger']);

    Yetix.addLayerToYetiLayersSelector({ title: 'slopes' }, 0);
    Yetix.addLayerToYetiLayersSelector({ title: 'areas' }, 1);
    await nextTick();
    expect(vm.yetiTitles).toEqual(['slopes', 'areas', 'danger']);
  });

  it('puts each overlay layer at its index, whatever the order they are added in', async () => {
    const vm = watchSelectors();

    Yetix.addLayerToOverlaysLayersSelector({ title: 'winter-route' }, 1);
    await nextTick();
    expect(vm.overlayTitles).toEqual([null, 'winter-route']);

    Yetix.addLayerToOverlaysLayersSelector({ title: 'protection-areas' }, 0);
    await nextTick();
    expect(vm.overlayTitles).toEqual(['protection-areas', 'winter-route']);
  });
});
