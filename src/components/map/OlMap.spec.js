import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { isProxy, nextTick } from 'vue';

import OlMap from './OlMap';

import ol from '@/js/libs/ol';

// the real source reads the header of a remote file as soon as it is created
vi.mock('ol-pmtiles', async () => {
  const { default: VectorTileSource } = await import('ol/source/VectorTile');
  return { PMTilesVectorSource: class extends VectorTileSource {} };
});

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
      stubs: {
        FaIcon: true,
        InputSlider: true,
        BiodivInformation: true,
        SwissProtectionAreaInformation: true,
        TransportInformation: true,
      },
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

  it('keeps the highlighted feature as is, not proxied', () => {
    const wrapper = mountMap();
    const feature = new ol.Feature();

    wrapper.vm.setHighlightedFeature(feature);

    expect(isProxy(wrapper.vm.highlightedFeature)).toBe(false);
    expect(wrapper.vm.highlightedFeature).toBe(feature);

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

  describe('public transport layer', () => {
    const transportButton = (wrapper) =>
      wrapper.findAll('.ol-control-layer-switcher .layer-group')[2].findAll(':scope > *')[0];

    it('is shown by default, without opening the tiles file until the map is zoomed in', () => {
      const wrapper = mountMap();

      expect(wrapper.vm.transportsVisible).toBe(true);
      expect(wrapper.vm.transportLayer.getVisible()).toBe(true);
      expect(wrapper.vm.map.getLayers().getArray()).toContain(wrapper.vm.transportLayer);
      expect(wrapper.vm.transportLayer.getSource()).toBeNull();
      expect(isProxy(wrapper.vm.transportLayer)).toBe(false);

      wrapper.vm.view.setZoom(4);
      wrapper.vm.openTransportTiles();
      expect(wrapper.vm.transportLayer.getSource()).toBeNull();

      wrapper.vm.view.setZoom(9);
      wrapper.vm.openTransportTiles();
      expect(wrapper.vm.transportLayer.getSource()).not.toBeNull();
      expect(isProxy(wrapper.vm.transportLayer.getSource())).toBe(false);

      wrapper.unmount();
    });

    it('is switched on and off from the layer switcher', async () => {
      const wrapper = mountMap();

      expect(transportButton(wrapper).classes()).toContain('selected');

      await transportButton(wrapper).trigger('click');
      expect(wrapper.vm.transportLayer.getVisible()).toBe(false);
      expect(transportButton(wrapper).classes()).not.toContain('selected');

      await transportButton(wrapper).trigger('click');
      expect(wrapper.vm.transportLayer.getVisible()).toBe(true);

      wrapper.unmount();
    });
  });
});
