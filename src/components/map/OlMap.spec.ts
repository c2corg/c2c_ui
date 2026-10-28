import type VectorLayer from 'ol/layer/Vector';
import { describe, expect, it, vi } from 'vitest';
import { isProxy, nextTick, reactive } from 'vue';

import { mountMap } from './test-utils';

import ol from '@/js/libs/ol';

// the point markers draw Font Awesome icons, which the specs don't load: plain styles instead
vi.mock('@/components/map/map-utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/map/map-utils')>()),
  getDocumentPointStyle: () => [],
}));

const selectedTitles = (wrapper: Awaited<ReturnType<typeof mountMap>>['wrapper']) =>
  wrapper.findAll('.ol-control-layer-switcher .layer-group').map((group) =>
    group
      .findAll(':scope > .selected')
      .map((button) => button.text())
      .join('+')
  );

// a GPS track: its second point has no elevation (0), 50 m from the first
const GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg>
<trkpt lat="45.9" lon="6.8"><ele>1000</ele></trkpt>
<trkpt lat="45.9003" lon="6.8003"><ele>0</ele></trkpt>
<trkpt lat="45.91" lon="6.81"><ele>1200</ele></trkpt>
</trkseg></trk></gpx>`;

describe('OlMap', () => {
  it('does not wrap OpenLayers objects in Vue reactive proxies', async () => {
    // OpenLayers can't render proxied layers: their tiles are disposed and reloaded endlessly
    const { wrapper, vm } = await mountMap();
    const layers = vm.map.getLayers().getArray();

    expect(layers.length).toBeGreaterThan(0);
    layers.forEach((layer) => {
      expect(isProxy(layer)).toBe(false);
      expect(isProxy((layer as VectorLayer).getSource())).toBe(false);
    });
    expect(isProxy(vm.mapLayers[0])).toBe(false);
    expect(isProxy(vm.geolocation)).toBe(false);

    wrapper.unmount();
  });

  it('keeps the highlighted feature as is, not proxied', async () => {
    const { wrapper, vm } = await mountMap();
    const feature = new ol.Feature();

    vm.setHighlightedFeature(feature);

    expect(isProxy(vm.highlightedFeature)).toBe(false);
    expect(vm.highlightedFeature).toBe(feature);

    wrapper.unmount();
  });

  it('updates the layer switcher selection when a layer is shown or hidden', async () => {
    const { wrapper, vm } = await mountMap();
    const [baseLayers, slopesLayers] = wrapper.findAll('.ol-control-layer-switcher .layer-group');

    expect(selectedTitles(wrapper).slice(0, 2)).toEqual(['OpenTopoMap', '']);

    await baseLayers.findAll(':scope > *')[1].trigger('click');
    await nextTick();
    expect(selectedTitles(wrapper)[0]).toBe('ESRI World Imagery');
    expect(vm.visibleLayer.get('title')).toBe('ESRI World Imagery');

    await slopesLayers.findAll(':scope > *')[0].trigger('click');
    await nextTick();
    expect(selectedTitles(wrapper)[1]).toBe('IGN Slopes');

    await slopesLayers.findAll(':scope > *')[0].trigger('click');
    await nextTick();
    expect(selectedTitles(wrapper)[1]).toBe('');

    wrapper.unmount();
  });

  it('gives the pages the OpenLayers map and its extent', async () => {
    const { wrapper } = await mountMap();
    // what a parent reaches through a template ref
    const exposed = (wrapper.vm.$.exposeProxy ?? {}) as {
      map?: unknown;
      getExtent?: unknown;
      fitMapToDocuments?: unknown;
    };

    expect(exposed.map).toBeInstanceOf(ol.Map);
    expect(exposed.getExtent).toBeTypeOf('function');
    expect(exposed.fitMapToDocuments).toBeTypeOf('function');

    wrapper.unmount();
  });

  it('fixes the missing GPS elevations of a route track, not of an outing one', async () => {
    const elevations = async (type: string) => {
      const editedDocument = reactive({ type, geometry: { geom: null, geom_detail: null } as Record<string, unknown> });
      const { wrapper, vm } = await mountMap({ editedDocument, geomDetailEditable: true });

      vm.setDocumentGeometryFromGeoFile(GPX);

      // a GPX track is a MultiLineString
      const track = JSON.parse(editedDocument.geometry.geom_detail as string) as { coordinates: number[][][] };
      wrapper.unmount();
      return track.coordinates[0].map((coord) => coord[2]);
    };

    // the point without elevation, close to the first one, takes its elevation
    expect(await elevations('r')).toEqual([1000, 1000, 1200]);
    // the outing tracks stay as recorded (it read the type of window.document: always fixed)
    expect(await elevations('o')).toEqual([1000, 0, 1200]);
  });
});
