import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { isProxy, nextTick } from 'vue';

import OlMap from './OlMap';

// not implemented in jsdom, needed by ol.Map
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    disconnect() {}
  }
);

const mountMap = () =>
  mount(OlMap, {
    attachTo: document.body,
    global: {
      mocks: {
        $gettext: (text) => text,
        $user: { isLogged: false },
        $route: { name: 'waypoint', query: {} },
        $router: { push: () => {}, resolve: () => ({ href: '' }) },
        $language: { current: 'fr' },
        $documentUtils: { getDocumentTitle: () => '', hasSameGeolocation: () => false },
        $dateUtils: {},
      },
      stubs: { FaIcon: true, InputSlider: true, BiodivInformation: true, SwissProtectionAreaInformation: true },
      directives: { translate: {} },
    },
  });

const selectedTitles = (wrapper) =>
  wrapper.findAll('.ol-control-layer-switcher .layer-group').map((group) =>
    group
      .findAll(':scope > .selected')
      .map((button) => button.text())
      .join('+')
  );

describe('OlMap', () => {
  it('does not wrap OpenLayers objects in Vue reactive proxies', () => {
    // OpenLayers can't render proxied layers: their tiles are disposed and reloaded endlessly
    const wrapper = mountMap();
    const layers = wrapper.vm.map.getLayers().getArray();

    expect(layers.length).toBeGreaterThan(0);
    layers.forEach((layer) => {
      expect(isProxy(layer)).toBe(false);
      expect(isProxy(layer.getSource())).toBe(false);
    });
    expect(isProxy(wrapper.vm.mapLayers[0])).toBe(false);
    expect(isProxy(wrapper.vm.geolocation)).toBe(false);

    wrapper.unmount();
  });

  it('updates the layer switcher selection when a layer is shown or hidden', async () => {
    const wrapper = mountMap();
    const [baseLayers, slopesLayers] = wrapper.findAll('.ol-control-layer-switcher .layer-group');

    expect(selectedTitles(wrapper).slice(0, 2)).toEqual(['OpenTopoMap', '']);

    await baseLayers.findAll(':scope > *')[1].trigger('click');
    await nextTick();
    expect(selectedTitles(wrapper)[0]).toBe('ESRI World Imagery');
    expect(wrapper.vm.visibleLayer.get('title')).toBe('ESRI World Imagery');

    await slopesLayers.findAll(':scope > *')[0].trigger('click');
    await nextTick();
    expect(selectedTitles(wrapper)[1]).toBe('IGN Slopes');

    await slopesLayers.findAll(':scope > *')[0].trigger('click');
    await nextTick();
    expect(selectedTitles(wrapper)[1]).toBe('');

    wrapper.unmount();
  });
});
