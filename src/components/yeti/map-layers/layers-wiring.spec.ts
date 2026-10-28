import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';

import DataAvalancheLayer from './DataAvalancheLayer.vue';
import NivosesLayer from './NivosesLayer.vue';
import OverlaysLayers from './OverlaysLayers.vue';
import { useLayer } from './layer';

import Tabs from '@/components/yeti/Tabs.vue';
import YetiMap from '@/components/yeti/YetiMap.vue';
import ol from '@/js/libs/ol';

// the components are read through their instance, as the layers read each other
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vm = any;
const vmOf = (wrapper: VueWrapper): Vm => wrapper.vm;

// what YetiMap provides, around a fake OpenLayers map
const fakeMap = () => ({ addLayer: vi.fn(), addOverlay: vi.fn(), getView: () => 'view' });
const provideFrom = (map: ReturnType<typeof fakeMap>) =>
  (YetiMap as Vm).provide.call({
    map,
    getExtent: (projection: string) => ['extent', projection],
    $gettext: (s: string) => s,
  });

const mountInMap = (component: object, { stubs = {} } = {}) => {
  const map = fakeMap();
  const wrapper = mount(component, {
    global: {
      provide: provideFrom(map),
      stubs: { FaIcon: true, ...stubs },
      mocks: { $gettext: (s: string) => s },
      directives: { translate: {} },
    },
  });
  return { wrapper, map };
};

describe('yeti map layers', () => {
  it('reach the map and its extent from YetiMap, at any depth', () => {
    const map = fakeMap();
    const Leaf = { setup: () => useLayer(), render: () => h('div') };
    const Container = { setup: () => useLayer(), render: () => h(Leaf) };

    const wrapper = mount(Container, { global: { provide: provideFrom(map) } });
    const leaf = vmOf(wrapper.findComponent(Leaf) as VueWrapper);

    expect(vmOf(wrapper).map).toBe(map);
    expect(leaf.map).toBe(map);
    expect(leaf.view).toBe('view');
    expect(leaf.getExtent('EPSG:4326')).toEqual(['extent', 'EPSG:4326']);
  });

  it('a layer built on IconLayer adds it to the map, and announces its layer selector', () => {
    const { wrapper, map } = mountInMap(NivosesLayer);

    expect(map.addLayer).toHaveBeenCalledWith(vmOf(wrapper).getLayer());
    expect(vmOf(wrapper).getLayer().get('name')).toBe('NivosesLayer');
    expect(wrapper.emitted('layer')![0][0]).toMatchObject({ title: 'Nivose beacons', image: 'nivose.png' });
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

    vmOf(wrapper).onMapClick({}, feature);
    expect(vmOf(wrapper).overlay).toEqual({ title: 'Beacon', massif: 'Mont-Blanc', url1: 'u1', url2: 'u2' });

    vmOf(wrapper).onMapLooseClick();
    expect(vmOf(wrapper).overlay).toEqual({ title: null, massif: null, url1: null, url2: null });
  });

  it('uses the icons of the layer built on IconLayer, when it has its own', () => {
    const { wrapper } = mountInMap(DataAvalancheLayer);

    const iconLayer = vmOf(wrapper).$refs.iconLayer;
    expect(iconLayer.iconSrc).toBe(vmOf(wrapper).iconSrc);
    expect(iconLayer.iconCardSrc).toBe(vmOf(wrapper).iconCardSrc);
  });

  it('dispatches map events from the top layer down, as the template orders them', () => {
    const names: string[] = [];
    const stub = (name: string) => ({ render: () => h('div'), methods: { name: () => name } });
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

    names.push(...vmOf(wrapper).layers.map((layer: { name: () => string }) => layer.name()));
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
      props: { tabs: [{ title: 'Layers', icon: 'layer-group' }] },
      global: { mocks: { $gettext: (s: string) => s }, stubs: { FaIcon: true } },
      attachTo: document.body.appendChild(document.createElement('div')),
    });

    wrapper.find('[role=tab]').element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await nextTick();

    expect(document.activeElement).toBe(panel);
    wrapper.unmount();
    panel.remove();
  });
});
