import { fromLonLat } from 'ol/proj';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Map3dView from './Map3dView.vue';
import { mountMap } from './test-utils';

import bus from '@/js/event-bus';

// MapLibre needs WebGL, which jsdom has not: a map that records what the view asks
const { markers } = vi.hoisted(() => ({
  markers: [] as { lngLat?: [number, number]; added: boolean; removed: boolean }[],
}));

vi.mock('maplibre-gl', () => {
  class Map {
    on() {}
    once() {}
    addControl() {}
    getBearing() {
      return 0;
    }
    getSource() {
      return { setData() {} };
    }
    setLayoutProperty() {}
    getBounds() {
      return { contains: () => true };
    }
    easeTo() {}
    cameraForBounds() {
      return null;
    }
    jumpTo() {}
    remove() {}
  }
  class Marker {
    state = { added: false, removed: false } as (typeof markers)[number];
    constructor() {
      markers.push(this.state);
    }
    setLngLat(lngLat: [number, number]) {
      this.state.lngLat = lngLat;
      return this;
    }
    addTo() {
      this.state.added = true;
      return this;
    }
    remove() {
      this.state.removed = true;
    }
  }
  return { Map, Marker, ScaleControl: class {}, setWorkerUrl() {}, addProtocol() {} };
});

const props = {
  bounds: [6.8, 45.8, 6.9, 45.9],
  documents: { type: 'FeatureCollection', features: [] },
};

describe('Map3dView', () => {
  beforeEach(() => {
    markers.length = 0;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('goes full screen with the element of the 2D map, so that the elevation profile stays', async () => {
    const container = document.createElement('div');
    container.id = 'fullscreen-map-container';
    container.requestFullscreen = vi.fn().mockResolvedValue(undefined);
    document.body.append(container);
    const { wrapper } = await mountMap({ ...props, fullScreenElementId: 'fullscreen-map-container' }, Map3dView);

    await wrapper.find('.ol-full-screen button').trigger('click');

    expect(container.requestFullscreen).toHaveBeenCalled();
    wrapper.unmount();
  });

  it('goes full screen alone without such an element', async () => {
    const { wrapper } = await mountMap(props, Map3dView);
    const root = wrapper.find('.map-3d').element as HTMLElement;
    root.requestFullscreen = vi.fn().mockResolvedValue(undefined);

    await wrapper.find('.ol-full-screen button').trigger('click');

    expect(root.requestFullscreen).toHaveBeenCalled();
    wrapper.unmount();
  });

  it('shows the point under the cursor of the elevation profile', async () => {
    const { wrapper } = await mountMap(props, Map3dView);

    bus.emit('elevation_profile', { action: 'cursor_move', coord: fromLonLat([6.87, 45.83]) });

    expect(markers).toHaveLength(1);
    expect(markers[0].added).toBe(true);
    expect(markers[0].lngLat![0]).toBeCloseTo(6.87, 6);
    expect(markers[0].lngLat![1]).toBeCloseTo(45.83, 6);

    bus.emit('elevation_profile', { action: 'cursor_move', coord: fromLonLat([6.88, 45.84]) });
    expect(markers).toHaveLength(1);

    bus.emit('elevation_profile', { action: 'cursor_end' });
    expect(markers[0].removed).toBe(true);

    wrapper.unmount();
    bus.emit('elevation_profile', { action: 'cursor_move', coord: fromLonLat([6.87, 45.83]) });
    expect(markers).toHaveLength(1);
  });
});
