import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import DataAvalancheLayer from './DataAvalancheLayer.vue';
import NivosesLayer from './NivosesLayer.vue';
import OverlaysLayers from './OverlaysLayers.vue';
import layerMixin from './layer';

import Tabs from '@/components/yeti/Tabs';
import YetiMap from '@/components/yeti/YetiMap';
import ol from '@/js/libs/ol';

// what YetiMap provides, around a fake OpenLayers map
const fakeMap = () => ({ addLayer: vi.fn(), addOverlay: vi.fn(), getView: () => 'view' });
const provideFrom = (map) =>
  YetiMap.provide.call({ map, getExtent: (projection) => ['extent', projection], $gettext: (s) => s });

const mountInMap = (component, options = {}) => {
  const map = fakeMap();
  const wrapper = mount(component, {
    provide: provideFrom(map),
    stubs: { FaIcon: true },
    mocks: { $gettext: (s) => s },
    directives: { translate: {} },
    ...options,
  });
  return { wrapper, map };
};

describe('yeti map layers', () => {
  it('reach the map and its extent from YetiMap, at any depth', () => {
    const map = fakeMap();
    const Leaf = { mixins: [layerMixin], render: (h) => h('div') };
    const Container = { mixins: [layerMixin], render: (h) => h(Leaf) };

    const wrapper = mount(Container, { provide: provideFrom(map) });
    const leaf = wrapper.findComponent(Leaf).vm;

    expect(wrapper.vm.map).toBe(map);
    expect(leaf.map).toBe(map);
    expect(leaf.view).toBe('view');
    expect(leaf.getExtent('EPSG:4326')).toEqual(['extent', 'EPSG:4326']);
  });

  it('a layer built on IconLayer adds it to the map, and announces its layer selector', () => {
    const { wrapper, map } = mountInMap(NivosesLayer);

    expect(map.addLayer).toHaveBeenCalledWith(wrapper.vm.getLayer());
    expect(wrapper.vm.getLayer().get('name')).toBe('NivosesLayer');
    expect(wrapper.emitted('layer')[0][0]).toMatchObject({ title: 'Nivose beacons', image: 'nivose.png' });
  });

  it('opens the overlay of the clicked feature, and closes it', () => {
    const { wrapper } = mountInMap(NivosesLayer);
    const feature = new ol.Feature({
      geometry: new ol.geom.Point([650000, 5750000]),
      name: 'Beacon',
      massif: 'Mont-Blanc',
      url1: 'u1',
      url2: 'u2',
      selectedStyle: new ol.style.Style({ image: new ol.style.Icon({ src: 'data:,selected' }) }),
    });

    wrapper.vm.onMapClick({}, feature);
    expect(wrapper.vm.overlay).toEqual({ title: 'Beacon', massif: 'Mont-Blanc', url1: 'u1', url2: 'u2' });

    wrapper.vm.onMapLooseClick();
    expect(wrapper.vm.overlay).toEqual({ title: null, massif: null, url1: null, url2: null });
  });

  it('uses the icons of the layer built on IconLayer, when it has its own', () => {
    const { wrapper } = mountInMap(DataAvalancheLayer);

    const iconLayer = wrapper.vm.$refs.iconLayer;
    expect(iconLayer.iconSrc).toBe(wrapper.vm.iconSrc);
    expect(iconLayer.iconCardSrc).toBe(wrapper.vm.iconCardSrc);
  });

  it('dispatches map events from the top layer down, as the template orders them', () => {
    const names = [];
    const stub = (name) => ({ render: (h) => h('div'), methods: { name: () => name } });
    const layers = [
      'ProtectedAreasLayer',
      'MeteoLayer',
      'WinterRouteLayer',
      'AvalancheBulletinsLayer',
      'DataAvalancheLayer',
      'FfvlLayer',
      'FlowcaptLayer',
      'NivosesLayer',
      'RommaLayer',
      'RouteLayer',
    ];
    const { wrapper } = mountInMap(OverlaysLayers, {
      stubs: Object.fromEntries(layers.map((name) => [name, stub(name)])),
    });

    names.push(...wrapper.vm.layers.map((layer) => layer.name()));
    expect(names).toEqual([...layers].reverse());
  });
});

describe('yeti tabs', () => {
  it('moves the focus to the open panel with the down arrow', async () => {
    const panel = document.createElement('div');
    panel.id = 'panel0';
    panel.tabIndex = 0;
    document.body.appendChild(panel);
    const wrapper = mount(Tabs, {
      propsData: { tabs: [{ id: 'layers', title: 'Layers' }] },
      mocks: { $gettext: (s) => s },
      stubs: { FaIcon: true },
      attachTo: document.body.appendChild(document.createElement('div')),
    });

    // Tabs reads event.which, read-only in jsdom
    const keydown = new KeyboardEvent('keydown', { bubbles: true });
    Object.defineProperty(keydown, 'which', { value: 40 }); // arrow down
    wrapper.find('[role=tab]').element.dispatchEvent(keydown);
    await wrapper.vm.$nextTick();

    expect(document.activeElement).toBe(panel);
    wrapper.destroy();
    panel.remove();
  });
});
