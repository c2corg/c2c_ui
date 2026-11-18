import { flushPromises } from '@vue/test-utils';
import type { FeatureCollection } from 'geojson';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import C2cMap from './C2cMap.vue';
import { type FakeMap, resetMocks, state } from './maplibre-mock';
import { mountMap as mount } from './test-utils';

import biodivSportsService from '@/js/apis/biodivsports-service';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import respecterCestProtegerService from '@/js/apis/respectercestproteger-service';
import bus from '@/js/event-bus';
import { fromLonLat } from '@/js/geo/projection';

vi.mock('maplibre-gl', () => import('./maplibre-mock'));
vi.mock('@/js/apis/biodivsports-service', () => ({ default: { fetchData: vi.fn() } }));
vi.mock('@/js/apis/respectercestproteger-service', () => ({ default: { hasArea: vi.fn(), identify: vi.fn() } }));
// the specs don't load Font Awesome: a plain icon
vi.mock('@/js/icon-svg', () => ({
  default: ({ iconName }: { iconName: string }) => `<svg data-icon="${iconName}" fill="currentColor"></svg>`,
}));

const mountMap = async (props: Record<string, unknown> = {}) => {
  const mounted = await mount(props, C2cMap);
  await flushPromises();
  return { ...mounted, map: state.maps[state.maps.length - 1] };
};

const point = (lon: number, lat: number) => JSON.stringify({ type: 'Point', coordinates: fromLonLat([lon, lat]) });
const line = (...lonLats: [number, number][]) =>
  JSON.stringify({ type: 'LineString', coordinates: lonLats.map((lonLat) => fromLonLat(lonLat)) });

const route = { document_id: 1, type: 'r', geometry: { geom: point(6.8, 45.9) } };
const waypoint = (id: number, type: string, lon: number) => ({
  document_id: id,
  type: 'w',
  waypoint_type: type,
  geometry: { geom: point(lon, 45.9) },
});

// the features drawn of the documents
const drawn = (map: FakeMap) => (map.data.documents as FeatureCollection).features;
const drawnKeys = (map: FakeMap) => drawn(map).map((feature) => feature.properties!.key);

const selectedTitles = (wrapper: Awaited<ReturnType<typeof mountMap>>['wrapper']) =>
  wrapper.findAll('.ol-control-layer-switcher .layer-group').map((group) =>
    group
      .findAll(':scope > .selected')
      .map((button) => button.text())
      .join('+')
  );

beforeEach(() => resetMocks());
afterEach(() => {
  document.body.innerHTML = '';
});

describe('C2cMap', () => {
  it('draws the documents, their waypoints, and the images of an outing away from it', async () => {
    const outing = {
      document_id: 2,
      type: 'o',
      geometry: { geom: point(6.8, 45.9), geom_detail: line([6.8, 45.9], [6.81, 45.91]) },
      associations: {
        waypoints: [waypoint(3, 'summit', 6.82), waypoint(4, 'virtual', 6.83)],
        images: [{ document_id: 5, type: 'i', geometry: { geom: point(6.84, 45.9) } }],
      },
    };
    const { wrapper, map } = await mountMap({ documents: [outing] });

    // the line alone, without the point of the outing; no virtual waypoint
    expect(drawnKeys(map)).toEqual(['documents:o:2:detail', 'waypoints:w:3:point', 'images:i:5:point']);
    const [track, summit] = drawn(map);
    expect(track.properties).toMatchObject({ casing: '#404040', casingWidth: 4.5, stroke: 'yellow', strokeWidth: 2.5 });
    expect(track.geometry).toMatchObject({ type: 'LineString' });
    expect((track.geometry as { coordinates: number[][] }).coordinates[0][0]).toBeCloseTo(6.8, 6);
    // the circle of OpenLayers: radius 15 with its stroke of 2
    expect(summit.properties).toMatchObject({ circleRadius: 14, circleStrokeWidth: 2, group: 'waypoints' });
    wrapper.unmount();
  });

  it('draws the two versions of the diff: the old one in red under the new one in green', async () => {
    const version = (lon: number) => ({
      ...route,
      geometry: { geom: point(lon, 45.9), geom_detail: line([lon, 45.9], [6.9, 46]) },
    });
    const { wrapper, map } = await mountMap({ oldDocument: version(6.8), newDocument: version(6.81) });

    const styles = drawn(map).map(({ properties, geometry }) => [
      properties!.key,
      geometry.type === 'Point' ? properties!.circleFill : properties!.stroke,
    ]);
    expect(styles).toEqual([
      ['old:r:1:point', 'rgba(255, 0, 0, 0.5)'],
      ['old:r:1:detail', 'red'],
      ['new:r:1:point', 'rgba(0, 255, 0, 0.9)'],
      ['new:r:1:detail', 'green'],
    ]);
    wrapper.unmount();
  });

  describe('on pointer move', () => {
    const move = (map: FakeMap, buttons = 0) =>
      map.fire('mousemove', { point: { x: 10, y: 10 }, originalEvent: { buttons } });

    it('highlights the hovered document, and tells the page only when it changes', async () => {
      const { wrapper, map } = await mountMap({ documents: [route] });
      map.rendered = [
        { layer: { id: 'documents-icon' }, geometry: { type: 'Point' }, properties: { key: 'documents:r:1:point' } },
      ];

      move(map);
      move(map);
      await flushPromises();
      expect(drawn(map)[0].properties).toMatchObject({ circleRadius: 19, circleSort: 101 });

      map.rendered = [];
      move(map);
      move(map);
      await flushPromises();

      expect(wrapper.emitted('highlight-document')).toEqual([[route], [null]]);
      expect(drawn(map)[0].properties).toMatchObject({ circleRadius: 14 });
      wrapper.unmount();
    });
  });

  describe('on click', () => {
    const click = (map: FakeMap, originalEvent: Record<string, unknown> = {}) =>
      map.fire('click', { point: { x: 10, y: 10 }, lngLat: { lng: 6.8, lat: 45.9 }, originalEvent });

    it('opens the document clicked, in a new tab with ctrl', async () => {
      const { wrapper, map } = await mountMap({ documents: [route, { ...route, document_id: 2 }] });
      const push = vi.spyOn(wrapper.vm.$router, 'push');
      const open = vi.spyOn(window, 'open').mockReturnValue(null);
      map.rendered = [
        { layer: { id: 'documents-icon' }, geometry: { type: 'Point' }, properties: { key: 'documents:r:2:point' } },
      ];

      click(map);
      click(map, { ctrlKey: true });

      expect(push).toHaveBeenCalledWith({ name: 'route', params: { id: 2 } });
      expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/routes\/2$/), '_blank');
      wrapper.unmount();
    });
  });

  it('highlights a stop with its name, then not', async () => {
    const stop = { document_id: 4, type: 's', stoparea_name: 'Gare', geometry: { geom: point(6.8, 45.9) } };
    const { wrapper, map } = await mountMap({ documents: [route, stop] });
    const exposed = wrapper.vm as unknown as { highlightStop(id: number): void; resetStopStyles(): void };

    exposed.highlightStop(4);
    await flushPromises();
    // the bus of the stops is green when highlighted
    expect(drawn(map)[1].properties).toMatchObject({ circleFill: '#4baf50', circleRadius: 19 });
    expect(
      state.markers.filter((marker) => marker.added && !marker.removed).map((m) => m.element?.textContent)
    ).toEqual(['Gare']);

    exposed.resetStopStyles();
    await flushPromises();
    expect(drawn(map)[1].properties).toMatchObject({ circleFill: '#337ab7', circleRadius: 14 });
    wrapper.unmount();
  });

  it('updates the layer switcher selection, and the layers, when a layer is shown or hidden', async () => {
    const { wrapper, map } = await mountMap();
    const [baseLayers, slopesLayers] = wrapper.findAll('.ol-control-layer-switcher .layer-group');

    expect(selectedTitles(wrapper).slice(0, 2)).toEqual(['OpenTopoMap', '']);

    await baseLayers.findAll(':scope > *')[1].trigger('click');
    expect(selectedTitles(wrapper)[0]).toBe('ESRI World Imagery');
    expect(map.layout['ESRI World Imagery'].visibility).toBe('visible');
    expect(map.layout.OpenTopoMap.visibility).toBe('none');

    await slopesLayers.findAll(':scope > *')[0].trigger('click');
    expect(selectedTitles(wrapper)[1]).toBe('IGN Slopes');
    expect(map.layout['IGN Slopes'].visibility).toBe('visible');

    await slopesLayers.findAll(':scope > *')[0].trigger('click');
    expect(selectedTitles(wrapper)[1]).toBe('');
    wrapper.unmount();
  });

  it('shows the point under the cursor of the elevation profile', async () => {
    const { wrapper, map } = await mountMap({ documents: [route] });

    bus.emit('elevation_profile', { action: 'cursor_move', coord: fromLonLat([6.8, 45.9]) });
    expect(map.data.profile).toMatchObject({ type: 'Point' });

    bus.emit('elevation_profile', { action: 'cursor_end' });
    expect(map.data.profile).toEqual({ type: 'FeatureCollection', features: [] });

    wrapper.unmount();
    bus.emit('elevation_profile', { action: 'cursor_move', coord: fromLonLat([6.8, 45.9]) });
  });

  it('shows the density of the Outings overlay, and turns the overlays off when the API does (503)', async () => {
    const heatmap = vi
      .spyOn(c2c, 'getOutingsHeatmap')
      .mockResolvedValueOnce({ data: { buckets: [{ x: 750000, y: 5760000, count: 3 }] } } as never)
      .mockRejectedValueOnce({ response: { status: 503 } });
    const { wrapper, map } = await mountMap();
    const outings = () => wrapper.findAll('.layer-button').filter((button) => button.text() === 'Outings');

    await outings()[0].trigger('click');
    await flushPromises();
    expect(heatmap).toHaveBeenCalledTimes(1);
    expect(map.layout['heatmap-outing'].visibility).toBe('visible');
    expect((map.data['heatmap-outing'] as FeatureCollection).features).toHaveLength(1);

    map.zoom = 5;
    map.extent = [0, 40, 10, 50];
    map.fire('moveend');
    await new Promise((resolve) => setTimeout(resolve, 500));
    await flushPromises();
    expect(outings()).toHaveLength(0);
    expect(map.layout['heatmap-outing'].visibility).toBe('none');
    wrapper.unmount();
  });

  describe('a click on the density of an overlay', () => {
    const outingLine = line([6.8, 45.9], [6.81, 45.91]);
    const recentOuting = (title: string) => ({ document_id: 1, type: 'o', title, geometry: { geom_detail: outingLine } });
    const mockLookups = (recent: (calls: number) => unknown) => {
      let calls = 0;
      vi.spyOn(c2c, 'getOutingsTracks').mockImplementation(((params: Record<string, unknown>) => {
        // too many tracks to draw them: the density
        if (!params.recent) return Promise.resolve({ data: { documents: [], truncated: true } });
        return recent(++calls);
      }) as never);
      vi.spyOn(c2c, 'getOutingsHeatmap').mockResolvedValue({ data: { buckets: [] } } as never);
    };
    const showDensity = async (props: Record<string, unknown> = {}) => {
      const mounted = await mountMap(props);
      mounted.map.zoom = 15;
      await mounted.wrapper
        .findAll('.layer-button')
        .find((button) => button.text() === 'Outings')!
        .trigger('click');
      await flushPromises();
      expect(mounted.map.layout['heatmap-outing'].visibility).toBe('visible');
      return mounted;
    };
    const clickAt = (map: FakeMap) =>
      map.fire('click', {
        point: { x: 10, y: 10 },
        lngLat: { lng: 6.8, lat: 45.9 },
        originalEvent: { pointerType: 'mouse' },
      });

    it('lists the most recent documents, and says how many there are', async () => {
      mockLookups(() =>
        Promise.resolve({ data: { documents: [recentOuting('Recent hike')], truncated: true, count: 412, count_capped: false } })
      );
      const { wrapper, map } = await showDensity();

      clickAt(map);
      await flushPromises();

      const panel = wrapper.find('.ol-track-panel');
      expect(panel.text()).toContain('Recent hike');
      expect(panel.text()).toContain('Only the most recent ones are listed');
      expect(panel.text()).toContain('(412)');
      wrapper.unmount();
    });

    it('says that there are more when the count is capped, and nothing when the API does not know', async () => {
      mockLookups((call) =>
        Promise.resolve({
          data:
            call === 1
              ? { documents: [recentOuting('Capped')], truncated: true, count: 1000, count_capped: true }
              : { documents: [recentOuting('Unknown')], truncated: true },
        })
      );
      const { wrapper, map } = await showDensity();

      clickAt(map);
      await flushPromises();
      expect(wrapper.find('.ol-track-panel').text()).toContain('(1000+)');

      clickAt(map);
      await flushPromises();
      expect(wrapper.find('.ol-track-panel').text()).toContain('Unknown');
      expect(wrapper.find('.ol-track-panel').text()).not.toMatch(/\(\d+\+?\)/);
      wrapper.unmount();
    });

    it('keeps the last click: the answer of an older one does not replace it', async () => {
      let releaseOld: () => void = () => undefined;
      mockLookups((call) =>
        call === 1
          ? // the first lookup is slow, the second one is fast
            new Promise((resolve) => {
              releaseOld = () => resolve({ data: { documents: [recentOuting('Old')], truncated: true } });
            })
          : Promise.resolve({ data: { documents: [recentOuting('New')], truncated: true } })
      );
      const { wrapper, map } = await showDensity();

      clickAt(map);
      clickAt(map);
      await flushPromises();
      releaseOld();
      await flushPromises();

      expect(wrapper.find('.ol-track-panel').text()).toContain('New');
      expect(wrapper.find('.ol-track-panel').text()).not.toContain('Old');
      wrapper.unmount();
    });

    it('goes on to identify the protection areas under the click', async () => {
      mockLookups(() => Promise.resolve({ data: { documents: [recentOuting('Recent hike')], truncated: true } }));
      const identify = vi.mocked(respecterCestProtegerService.identify).mockResolvedValue({ data: { results: [] } } as never);
      const { wrapper, map } = await showDensity({ showProtectionAreas: true });

      clickAt(map);
      await flushPromises();

      expect(wrapper.find('.ol-track-panel').text()).toContain('Recent hike');
      expect(identify).toHaveBeenCalledTimes(1);
      wrapper.unmount();
    });
  });

  describe('biodiv-sports areas', () => {
    const fetchData = vi.mocked(biodivSportsService.fetchData);
    // an area around [lon, 45.9]
    const area = (id: number, lon = 6.8, lat = 45.9) => ({
      id,
      name: `area ${id}`,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [lon - 0.001, lat - 0.001],
            [lon + 0.001, lat - 0.001],
            [lon + 0.001, lat + 0.001],
            [lon - 0.001, lat - 0.001],
          ],
        ],
      },
    });
    // a view of about 2 x halfSize metres around a point
    const viewAround = (lon: number, lat: number, halfSize: number) => {
      const degrees = halfSize / 111000;
      return [lon - degrees, lat - degrees, lon + degrees, lat + degrees] as [number, number, number, number];
    };
    const moveTo = async (map: FakeMap, extent: [number, number, number, number]) => {
      map.extent = extent;
      map.fire('moveend');
      await flushPromises();
    };
    const areas = (map: FakeMap) => (map.data.protection as FeatureCollection).features;

    beforeEach(() => {
      fetchData.mockReset();
      vi.mocked(respecterCestProtegerService.hasArea).mockReset().mockResolvedValue(false);
    });

    it('are loaded once for the viewed extent and around it', async () => {
      fetchData.mockResolvedValue({ data: { results: [area(1)] } } as never);
      const { wrapper, map } = await mountMap({ showProtectionAreas: true });

      // the first view, then far away
      await moveTo(map, viewAround(7.5, 45.9, 5000));
      // a small move, then zooming in: already loaded
      await moveTo(map, viewAround(7.52, 45.9, 5000));
      await moveTo(map, viewAround(7.5, 45.9, 1000));

      expect(fetchData).toHaveBeenCalledTimes(2);
      expect(areas(map)).toHaveLength(1);
      expect(map.layout['protection-fill'].visibility).toBe('visible');
      wrapper.unmount();
    });

    it('are loaded again after a failure, and tell the page once', async () => {
      fetchData
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValue({ data: { results: [area(1), area(2, 6.801)] } } as never);
      const { wrapper, map } = await mountMap({ showProtectionAreas: true });
      // the first load, at the first view, fails
      await flushPromises();
      expect(wrapper.emitted('has-protection-area')).toBeUndefined();

      await moveTo(map, map.extent);
      await moveTo(map, map.extent);
      await moveTo(map, viewAround(7.5, 45.9, 500));

      expect(areas(map)).toHaveLength(2);
      expect(wrapper.emitted('has-protection-area')).toHaveLength(1);
      wrapper.unmount();
    });
  });

  describe('in 3D', () => {
    const outing = {
      document_id: 1,
      type: 'o',
      activities: ['hiking'],
      geometry: { geom: point(6.28, 45.9), geom_detail: line([6.28, 45.9], [6.29, 45.91]) },
      associations: { routes: [{ document_id: 7 }] },
    };
    const open3d = async (wrapper: Awaited<ReturnType<typeof mountMap>>['wrapper']) => {
      await wrapper.find('.ol-control-3d button').trigger('click');
      await flushPromises();
    };
    const shownMarkers = () => state.markers.filter((marker) => marker.added && !marker.removed);

    it('tilts the same map on the terrain, and goes back to the 2D view', async () => {
      const { wrapper, map } = await mountMap({ documents: [route], show3d: true });
      map.cameras.length = 0;
      map.zoom = 11;

      await open3d(wrapper);
      expect(map.terrain).toMatchObject({ source: 'terrain' });
      expect(map.pitch).toBe(60);
      expect(map.dragRotate.enabled).toBe(true);
      expect(map.layout['documents-3d'].visibility).toBe('visible');
      expect(map.layout['documents-icon'].visibility).toBe('none');
      expect(wrapper.find('.ol-control-3d').text()).toBe('2D');

      await wrapper.find('.ol-control-3d button').trigger('click');
      expect(map.terrain).toBeNull();
      expect(map.cameras.at(-1)).toMatchObject({ zoom: 11, pitch: 0, bearing: 0 });
      expect(map.dragRotate.enabled).toBe(false);
      expect(map.layout['documents-icon'].visibility).toBe('visible');
      wrapper.unmount();
    });

    it('multiplies the protection areas onto the ground, not the slopes', async () => {
      const { wrapper, map } = await mountMap({ documents: [route], show3d: true, showProtectionAreas: true });
      expect(map.paint['Swiss tranquility zones']['raster-layer-blend']).toBe('normal');

      await open3d(wrapper);

      expect(map.paint['Swiss tranquility zones']).toMatchObject({
        'raster-opacity': 0.7,
        'raster-layer-blend': 'multiply',
      });
      expect(map.paint['protection-fill']).toMatchObject({ 'fill-opacity': 0.4, 'fill-layer-blend': 'multiply' });
      expect(map.paint['IGN Slopes']).toEqual({ 'raster-opacity': 0.4 });
      wrapper.unmount();
    });

    it('also shows the waypoints of the routes of an outing, read when it opens', async () => {
      const get = vi.spyOn(c2c.route as DocumentService, 'get').mockReturnValue(
        Promise.resolve({
          data: {
            associations: {
              waypoints: [waypoint(11, 'summit', 6.285), waypoint(12, 'access', 6.281), waypoint(13, 'virtual', 6.3)],
            },
          },
        }) as never
      );
      const { wrapper, map } = await mountMap({ documents: [outing], show3d: true });

      await open3d(wrapper);

      expect(get).toHaveBeenCalledWith(7, 'fr');
      // the virtual waypoint is left out, as on the 2D map
      expect(shownMarkers()).toHaveLength(2);
      expect(shownMarkers()[0].lngLat![0]).toBeCloseTo(6.285, 6);
      expect((map.data['documents-3d'] as FeatureCollection).features).toHaveLength(1);
      wrapper.unmount();
    });
  });
});
