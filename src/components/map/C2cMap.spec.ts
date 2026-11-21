import { flushPromises } from '@vue/test-utils';
import type { FeatureCollection } from 'geojson';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LocationQueryRaw } from 'vue-router';

import C2cMap from './C2cMap.vue';
import { type FakeMap, resetMocks, state } from './maplibre-mock';
import { mountMap as mount } from './test-utils';

import biodivSportsService from '@/js/apis/biodivsports-service';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import respecterCestProtegerService from '@/js/apis/respectercestproteger-service';
import bus from '@/js/event-bus';
import { extentToLonLat, fromLonLat } from '@/js/geo/projection';
import { useOfflineStore } from '@/stores/offline';

vi.mock('maplibre-gl', () => import('./maplibre-mock'));
vi.mock('@/js/apis/biodivsports-service', () => ({ default: { fetchData: vi.fn() } }));
vi.mock('@/js/apis/respectercestproteger-service', () => ({ default: { hasArea: vi.fn(), identify: vi.fn() } }));
// the specs don't load Font Awesome: a plain icon
vi.mock('@/js/icon-svg', () => ({
  default: ({ iconName }: { iconName: string }) => `<svg data-icon="${iconName}" fill="currentColor"></svg>`,
}));

const mountMap = async (props: Record<string, unknown> = {}, path = '/') => {
  const mounted = await mount(props, C2cMap, path);
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

beforeEach(() => {
  resetMocks();
  // no network: a vector map shown in 3D gets no style unless the test gives one (a failed style is not cached)
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('no network in tests'));
});
afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
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

  it('without a network, keeps the base layer at best effort, says so, and offers only what works', async () => {
    const { wrapper, map } = await mountMap({ show3d: true, showRecenterOn: true });
    const [baseLayers, slopesLayers] = wrapper.findAll('.ol-control-layer-switcher .layer-group');
    await baseLayers.findAll(':scope > *')[3].trigger('click');
    await slopesLayers.findAll(':scope > *')[0].trigger('click');
    expect(map.layout['IGN maps'].visibility).toBe('visible');
    expect(wrapper.find('.ol-control-3d').exists()).toBe(true);
    expect(wrapper.find('.c2c-map-offline-chip').exists()).toBe(false);

    const offline = useOfflineStore();
    offline.online = false;
    await flushPromises();

    // the tiles in memory: no topo saved offline, nothing under it
    expect(map.layout['IGN maps'].visibility).toBe('visible');
    expect(map.layout.OpenTopoMap.visibility).toBe('none');
    expect(map.layout['IGN Slopes'].visibility).toBe('none');
    expect(wrapper.find('.c2c-map-offline-chip').text()).toContain('Offline');
    expect(wrapper.find('.c2c-map-offline-status').text()).toContain('IGN maps: only the areas already seen');
    expect(wrapper.find('.ol-control-3d').exists()).toBe(false);
    expect(wrapper.find('.ol-control-recenter-on').isVisible()).toBe(false);
    // one base layer to choose, no slopes
    expect(selectedTitles(wrapper)).toEqual(['IGN maps']);

    // the network back: the slopes again, the tiles that failed asked again
    offline.online = true;
    await flushPromises();
    expect(map.layout['IGN maps'].visibility).toBe('visible');
    expect(map.layout['IGN Slopes'].visibility).toBe('visible');
    expect(map.reloaded).toEqual(['IGN maps']);
    expect(wrapper.find('.c2c-map-offline-chip').exists()).toBe(false);
    wrapper.unmount();
  });

  const frenchRoute = { ...route, areas: [{ document_id: 14274 }] };
  const savedRoute = (layers: Record<string, number>) => ({
    type: 'route',
    id: 1,
    lang: 'fr',
    data: {},
    title: 'Arête',
    folderId: null,
    mode: 'offline' as const,
    savedAt: 0,
    downloadedAt: Date.now(),
    assets: { done: true, failed: 0, layers },
  });

  it('without a network, shows the downloaded OpenTopoMap under the base layer, which can be shown alone', async () => {
    window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { layer: 'ign' } }));
    const { wrapper, map } = await mountMap({ documents: [frenchRoute], rememberSettings: true }, '/routes/1');
    expect(map.layout['IGN maps'].visibility).toBe('visible');
    const stored = window.localStorage.getItem('DocumentMap.preferences');
    const offline = useOfflineStore();
    offline.savedDocs = [savedRoute({ OpenTopoMap: 15 })];
    offline.online = false;
    await flushPromises();

    expect(map.layout['IGN maps'].visibility).toBe('visible');
    expect(map.layout.OpenTopoMap.visibility).toBe('visible');
    const status = wrapper.findAll('.c2c-map-offline-status p').map((line) => line.text());
    expect(status).toEqual(['IGN maps: only the areas already seen', 'OpenTopoMap: downloaded, shown underneath']);

    // OpenTopoMap alone, for now only
    const [baseButtons] = wrapper.findAll('.ol-control-layer-switcher .layer-group');
    expect(baseButtons.findAll(':scope > *').map((button) => button.text())).toEqual(['OpenTopoMap', 'IGN maps']);
    await baseButtons.findAll(':scope > *')[0].trigger('click');
    expect(map.layout['IGN maps'].visibility).toBe('none');
    expect(map.layout.OpenTopoMap.visibility).toBe('visible');
    expect(selectedTitles(wrapper)[0]).toBe('OpenTopoMap');
    expect(wrapper.find('.c2c-map-offline-status').text()).toContain('OpenTopoMap: downloaded');
    expect(window.localStorage.getItem('DocumentMap.preferences')).toBe(stored);

    offline.online = true;
    await flushPromises();
    expect(map.layout['IGN maps'].visibility).toBe('visible');
    expect(map.layout.OpenTopoMap.visibility).toBe('none');
    wrapper.unmount();
    window.localStorage.removeItem('DocumentMap.preferences');
  });

  it('opened without a network, shows the downloaded layer instead of the base layer, and says so', async () => {
    window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { layer: 'ign' } }));
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { wrapper, map } = await mountMap({ documents: [frenchRoute], rememberSettings: true }, '/routes/1');
    useOfflineStore().savedDocs = [savedRoute({ OpenTopoMap: 15 })];
    await flushPromises();

    expect(map.layout['IGN maps'].visibility).toBe('none');
    expect(map.layout.OpenTopoMap.visibility).toBe('visible');
    expect(selectedTitles(wrapper)[0]).toBe('OpenTopoMap');
    const status = wrapper.findAll('.c2c-map-offline-status p').map((line) => line.text());
    expect(status).toEqual(['IGN maps: not available offline', 'OpenTopoMap: downloaded, shown instead']);
    wrapper.unmount();
    window.localStorage.removeItem('DocumentMap.preferences');
  });

  it('without a network, offers the layers downloaded with the topo shown', async () => {
    // the layers chosen: SwissTopo and both slopes, kept on the device
    window.localStorage.setItem(
      'DocumentMap.preferences',
      JSON.stringify({ settings: { layer: 'swiss', slopes: 'swiss,ign' } })
    );
    const { wrapper, map } = await mountMap(
      { documents: [{ ...route, areas: [{ document_id: 14067 }] }], rememberSettings: true },
      '/routes/1'
    );
    const offline = useOfflineStore();
    // the route saved offline with SwissTopo and its slopes (offline-assets.ts)
    offline.savedDocs = [savedRoute({ OpenTopoMap: 15, SwissTopo: 16, 'SwissTopo Slopes': 15 })];
    offline.online = false;
    await flushPromises();

    expect(map.layout.SwissTopo.visibility).toBe('visible');
    expect(map.layout['SwissTopo Slopes'].visibility).toBe('visible');
    // the IGN slopes were not downloaded
    expect(map.layout['IGN Slopes'].visibility).toBe('none');
    expect(wrapper.find('.c2c-map-offline-status').text()).toContain('SwissTopo: downloaded');
    const [baseButtons, slopeButtons] = wrapper.findAll('.ol-control-layer-switcher .layer-group');
    expect(baseButtons.findAll(':scope > *').map((button) => button.text())).toEqual(['OpenTopoMap', 'SwissTopo']);
    expect(slopeButtons.findAll(':scope > *').map((button) => button.text())).toEqual(['SwissTopo Slopes']);
    wrapper.unmount();
    window.localStorage.removeItem('DocumentMap.preferences');
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
    const recentOuting = (title: string) => ({
      document_id: 1,
      type: 'o',
      title,
      geometry: { geom_detail: outingLine },
    });
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
        Promise.resolve({
          data: { documents: [recentOuting('Recent hike')], truncated: true, count: 412, count_capped: false },
        })
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
      vi.mocked(biodivSportsService.fetchData).mockResolvedValue({ data: { results: [] } } as never);
      vi.mocked(respecterCestProtegerService.hasArea).mockResolvedValue(false);
      const identify = vi
        .mocked(respecterCestProtegerService.identify)
        .mockResolvedValue({ data: { results: [] } } as never);
      const { wrapper, map } = await showDensity({ showProtectionAreas: true });

      clickAt(map);
      await flushPromises();

      expect(wrapper.find('.ol-track-panel').text()).toContain('Recent hike');
      expect(identify).toHaveBeenCalledTimes(1);
      wrapper.unmount();
    });
  });

  describe('settings of the document maps, kept on this device', () => {
    const heatmap = () =>
      vi
        .spyOn(c2c, 'getOutingsHeatmap')
        .mockResolvedValue({ data: { buckets: [{ x: 750000, y: 5760000, count: 3 }] } } as never);
    const queryOf = (wrapper: Awaited<ReturnType<typeof mountMap>>['wrapper']) =>
      (wrapper.vm as unknown as { $route: { query: unknown } }).$route.query;
    const stored = () => JSON.parse(window.localStorage.getItem('DocumentMap.preferences') ?? '{}').settings;

    beforeEach(() => window.localStorage.removeItem('DocumentMap.preferences'));
    afterEach(() => window.localStorage.removeItem('DocumentMap.preferences'));

    it('stores the settings that differ from the default but the overlays, and leaves the URL alone', async () => {
      heatmap();
      const { wrapper } = await mountMap({ rememberSettings: true }, '/routes/1/fr?debug=1#description');
      const [baseLayers, slopesLayers] = wrapper.findAll('.ol-control-layer-switcher .layer-group');

      await baseLayers.findAll(':scope > *')[1].trigger('click');
      await slopesLayers.findAll(':scope > *')[0].trigger('click');
      await wrapper
        .findAll('.layer-button')
        .find((button) => button.text() === 'Outings')!
        .trigger('click');
      await flushPromises();
      expect(stored()).toEqual({ category: 'ortho', slopes: 'ign' });
      expect(queryOf(wrapper)).toEqual({ debug: '1' });
      expect((wrapper.vm as unknown as { $route: { hash: string } }).$route.hash).toBe('#description');

      await baseLayers.findAll(':scope > *')[0].trigger('click');
      await flushPromises();
      expect(stored()).toEqual({ slopes: 'ign' });
      wrapper.unmount();
    });

    it('shows the stored settings on the next document map, but not the overlays a device stored before', async () => {
      const outings = heatmap();
      window.localStorage.setItem(
        'DocumentMap.preferences',
        // a layer stored before the categories: its category
        JSON.stringify({ settings: { layer: 'esri', slopes: 'ign', overlays: 'outing' } })
      );
      const { wrapper, map } = await mountMap({ rememberSettings: true }, '/routes/2/fr');

      expect(map.layout['ESRI World Imagery'].visibility).toBe('visible');
      expect(map.layout['IGN Slopes'].visibility).toBe('visible');
      expect(outings).not.toHaveBeenCalled();
      expect(map.layout['heatmap-outing']?.visibility ?? 'none').toBe('none');
      wrapper.unmount();
    });

    it('shows the settings of an old shared link, over the stored ones, keeping only the category of its layer', async () => {
      const outings = heatmap();
      window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { category: 'ortho' } }));
      const { wrapper, map } = await mountMap(
        { rememberSettings: true },
        '/routes/1/fr?layer=es&slopes=ign&overlays=outing&protection=0'
      );

      expect(map.layout['IGN raster (es)'].visibility).toBe('visible');
      expect(map.layout['IGN Slopes'].visibility).toBe('visible');
      expect(outings).toHaveBeenCalled();
      expect(map.layout['heatmap-outing'].visibility).toBe('visible');
      expect(stored()).toEqual({ category: 'national' });
      wrapper.unmount();
    });

    it('stores only the setting the user changes, not the others of an old shared link', async () => {
      heatmap();
      window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { protection: '0' } }));
      const { wrapper, map } = await mountMap({ rememberSettings: true }, '/routes/1/fr?layer=es&overlays=outing');
      const [, slopesLayers] = wrapper.findAll('.ol-control-layer-switcher .layer-group');

      await slopesLayers.findAll(':scope > *')[0].trigger('click');
      await flushPromises();
      expect(map.layout['IGN raster (es)'].visibility).toBe('visible');
      expect(stored()).toEqual({ category: 'national', slopes: 'ign', protection: '0' });
      wrapper.unmount();
    });

    it('keeps the hidden protection areas when a map that does not offer them changes its layer', async () => {
      window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { protection: '0' } }));
      const { wrapper } = await mountMap({ rememberSettings: true }, '/outings/1/fr');
      const [baseLayers] = wrapper.findAll('.ol-control-layer-switcher .layer-group');

      await baseLayers.findAll(':scope > *')[1].trigger('click');
      await flushPromises();
      expect(stored()).toEqual({ category: 'ortho', protection: '0' });
      wrapper.unmount();
    });

    it('shows the layer of the stored category in the country of each document', async () => {
      const inCountry = (id: number) => ({ ...route, areas: [{ document_id: 14400 }, { document_id: id }] });
      window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { category: 'national' } }));

      const { wrapper, map } = await mountMap({ documents: [inCountry(14274)], rememberSettings: true }, '/routes/1');
      expect(selectedTitles(wrapper)[0]).toBe('IGN maps');

      // the page of another document, in the same map
      await wrapper.setProps({ documents: [inCountry(14067)] });
      await flushPromises();
      expect(selectedTitles(wrapper)[0]).toBe('SwissTopo');
      expect(map.layout.SwissTopo.visibility).toBe('visible');

      // in Catalonia (Spain, Girona): the ICGC map, not the IGN Spain one
      await wrapper.setProps({ documents: [{ ...route, areas: [{ document_id: 14267 }, { document_id: 279939 }] }] });
      await flushPromises();
      expect(selectedTitles(wrapper)[0]).toBe('ICGC raster (ca)');

      // no national map in Italy
      await wrapper.setProps({ documents: [inCountry(14270)] });
      await flushPromises();
      expect(selectedTitles(wrapper)[0]).toBe('OpenTopoMap');
      expect(stored()).toEqual({ category: 'national' });
      wrapper.unmount();

      window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { category: 'ortho' } }));
      const other = await mountMap({ documents: [inCountry(14081)], rememberSettings: true }, '/routes/1');
      // no orthophoto of the United Kingdom
      expect(selectedTitles(other.wrapper)[0]).toBe('ESRI World Imagery');
      other.wrapper.unmount();
    });

    it('keeps the category of a layer clicked on a document, not the layer', async () => {
      const { wrapper } = await mountMap(
        { documents: [{ ...route, areas: [{ document_id: 14274 }] }], rememberSettings: true },
        '/routes/1'
      );
      const [baseLayers] = wrapper.findAll('.ol-control-layer-switcher .layer-group');

      await baseLayers
        .findAll(':scope > *')
        .find((button) => button.text() === 'SwissTopo')!
        .trigger('click');
      await flushPromises();
      expect(selectedTitles(wrapper)[0]).toBe('SwissTopo');
      expect(stored()).toEqual({ category: 'national' });
      wrapper.unmount();

      const next = await mountMap(
        { documents: [{ ...route, areas: [{ document_id: 14274 }] }], rememberSettings: true },
        '/routes/2'
      );
      expect(selectedTitles(next.wrapper)[0]).toBe('IGN maps');
      next.wrapper.unmount();
    });

    it('neither reads nor stores them for a map that did not ask for it (a listing: its query is its filters)', async () => {
      window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { layer: 'es' } }));
      const { wrapper, map } = await mountMap({}, '/routes?act=skitouring&layer=es');
      const [baseLayers] = wrapper.findAll('.ol-control-layer-switcher .layer-group');

      expect(map.layout['IGN raster (es)']?.visibility).not.toBe('visible');
      await baseLayers.findAll(':scope > *')[1].trigger('click');
      await flushPromises();
      expect(queryOf(wrapper)).toEqual({ act: 'skitouring', layer: 'es' });
      expect(stored()).toEqual({ layer: 'es' });
      wrapper.unmount();
    });
  });

  describe('settings in the URL of a list (syncUrl)', () => {
    const queryOf = (wrapper: Awaited<ReturnType<typeof mountMap>>['wrapper']) =>
      (wrapper.vm as unknown as { $route: { query: unknown } }).$route.query;
    const stored = () => window.localStorage.getItem('DocumentMap.preferences');

    beforeEach(() => window.localStorage.removeItem('DocumentMap.preferences'));

    it('shows the settings of the query, without storing them', async () => {
      const outings = vi
        .spyOn(c2c, 'getOutingsHeatmap')
        .mockResolvedValue({ data: { buckets: [{ x: 750000, y: 5760000, count: 3 }] } } as never);
      const { wrapper, map } = await mountMap(
        { syncUrl: true },
        '/routes?act=skitouring&layer=es&slopes=ign&overlays=outing'
      );

      expect(map.layout['IGN raster (es)'].visibility).toBe('visible');
      expect(map.layout['IGN Slopes'].visibility).toBe('visible');
      expect(outings).toHaveBeenCalled();
      expect(map.layout['heatmap-outing'].visibility).toBe('visible');
      expect(stored()).toBeNull();
      wrapper.unmount();
    });

    it('writes the settings the user changes in the query, next to the search filters, and not in the storage', async () => {
      vi.spyOn(c2c, 'getOutingsHeatmap').mockResolvedValue({ data: { buckets: [] } } as never);
      const { wrapper } = await mountMap({ syncUrl: true }, '/routes?act=skitouring&bbox=1,2,3,4');
      const [baseLayers, slopesLayers] = wrapper.findAll('.ol-control-layer-switcher .layer-group');

      await baseLayers.findAll(':scope > *')[1].trigger('click');
      await slopesLayers.findAll(':scope > *')[0].trigger('click');
      await wrapper
        .findAll('.layer-button')
        .find((button) => button.text() === 'Routes')!
        .trigger('click');
      await flushPromises();
      expect(queryOf(wrapper)).toEqual({
        act: 'skitouring',
        bbox: '1,2,3,4',
        layer: 'esri',
        slopes: 'ign',
        overlays: 'route',
      });

      await baseLayers.findAll(':scope > *')[0].trigger('click');
      await flushPromises();
      expect(queryOf(wrapper)).toEqual({ act: 'skitouring', bbox: '1,2,3,4', slopes: 'ign', overlays: 'route' });
      expect(stored()).toBeNull();
      wrapper.unmount();
    });

    it('follows the query when it changes (back, another link)', async () => {
      const { wrapper, map } = await mountMap({ syncUrl: true }, '/routes?layer=es');
      const router = (wrapper.vm as unknown as { $router: { replace(to: object): Promise<unknown> } }).$router;

      await router.replace({ query: { act: 'hiking', slopes: 'swiss' } });
      await flushPromises();
      expect(map.layout['IGN raster (es)'].visibility).not.toBe('visible');
      expect(map.layout['SwissTopo Slopes'].visibility).toBe('visible');
      expect(queryOf(wrapper)).toEqual({ act: 'hiking', slopes: 'swiss' });
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

  describe('national layers far from the view', () => {
    const buttons = (wrapper: Awaited<ReturnType<typeof mountMap>>['wrapper'], group = 0) =>
      wrapper.findAll('.ol-control-layer-switcher .layer-group')[group].findAll(':scope > .layer-button');
    const outsideTitles = (wrapper: Awaited<ReturnType<typeof mountMap>>['wrapper'], group = 0) =>
      buttons(wrapper, group)
        .filter((button) => button.classes('outside'))
        .map((button) => button.text());
    const moveTo = async (map: FakeMap, extent: [number, number, number, number]) => {
      map.extent = extent;
      map.fire('moveend');
      await flushPromises();
    };
    // the layer chosen in a test is stored: not for the next one
    afterEach(() => window.localStorage.removeItem('DocumentMap.preferences'));

    it('are greyed out, still a choice, the world layers and the layer shown never', async () => {
      const { wrapper, map } = await mountMap();
      // the Mont Blanc: France and Switzerland near, not Spain, Catalonia, Austria nor Great Britain
      expect(outsideTitles(wrapper)).toEqual([
        'IGN raster (es)',
        'IGN ortho (es)',
        'ICGC raster (ca)',
        'ICGC ortho (ca)',
        'Basemap (at)',
        'Basemap ortho (at)',
        'Ordnance Survey (uk)',
      ]);
      expect(outsideTitles(wrapper, 1)).toEqual([]);
      expect(
        buttons(wrapper)
          .find((button) => button.classes('outside'))!
          .attributes('title')
      ).toBe('Not available here');

      // Barcelona: Spain and Catalonia, France is too far
      await moveTo(map, [2.0, 41.3, 2.3, 41.5]);
      expect(outsideTitles(wrapper)).toEqual([
        'IGN maps',
        'IGN ortho',
        'SwissTopo',
        'SwissTopo ortho',
        'Basemap (at)',
        'Basemap ortho (at)',
        'Ordnance Survey (uk)',
      ]);
      expect(outsideTitles(wrapper, 1)).toEqual(['IGN Slopes', 'SwissTopo Slopes']);

      // chosen all the same: shown, so not greyed out
      await buttons(wrapper)
        .find((button) => button.text() === 'SwissTopo')!
        .trigger('click');
      expect(selectedTitles(wrapper)[0]).toBe('SwissTopo');
      expect(map.layout.SwissTopo.visibility).toBe('visible');
      expect(outsideTitles(wrapper)).not.toContain('SwissTopo');

      // zoomed out over Europe: every layer applies
      await moveTo(map, [-10, 35, 20, 60]);
      expect(outsideTitles(wrapper)).toEqual([]);
      wrapper.unmount();
    });

    it('in the overseas departments, offer the IGN maps', async () => {
      const { wrapper, map } = await mountMap();
      // Réunion
      await moveTo(map, [55.4, -21.2, 55.6, -21.0]);
      expect(outsideTitles(wrapper)).not.toContain('IGN maps');
      expect(outsideTitles(wrapper)).toContain('SwissTopo');
      wrapper.unmount();
    });

    it('without a network, are greyed out among the layers offered offline', async () => {
      window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { layer: 'swiss' } }));
      const { wrapper, map } = await mountMap(
        { documents: [{ ...route, areas: [{ document_id: 14067 }] }], rememberSettings: true },
        '/routes/1'
      );
      const offline = useOfflineStore();
      offline.savedDocs = [savedRoute({ OpenTopoMap: 15, SwissTopo: 16 })];
      offline.online = false;
      await flushPromises();
      expect(buttons(wrapper).map((button) => button.text())).toEqual(['OpenTopoMap', 'SwissTopo']);

      // shown: never greyed out, even far away
      await moveTo(map, [0.5, 42.6, 0.7, 42.8]);
      expect(outsideTitles(wrapper)).toEqual([]);

      await buttons(wrapper)[0].trigger('click');
      expect(selectedTitles(wrapper)[0]).toBe('OpenTopoMap');
      expect(outsideTitles(wrapper)).toEqual(['SwissTopo']);

      // back near Switzerland
      await moveTo(map, [6.7, 45.8, 6.9, 46.0]);
      expect(outsideTitles(wrapper)).toEqual([]);
      offline.online = true;
      await flushPromises();
      wrapper.unmount();
    });

    it('in 3D, by the ground at the center of the view, not by the extent that reaches the horizon', async () => {
      const { wrapper, map } = await mountMap({ documents: [route], show3d: true });
      await wrapper.find('.ol-control-3d button').trigger('click');
      await flushPromises();

      // the center in Switzerland, the extent down to the Pyrenees
      await moveTo(map, [2, 44, 12, 49.4]);
      expect(outsideTitles(wrapper)).toContain('IGN ortho (es)');
      expect(outsideTitles(wrapper)).not.toContain('SwissTopo ortho');
      expect(outsideTitles(wrapper)).not.toContain('Sentinel-2');

      // the same extent in 2D: Spain is in it
      await wrapper.find('.ol-control-3d button').trigger('click');
      await moveTo(map, [2, 44, 12, 49.4]);
      expect(outsideTitles(wrapper)).not.toContain('IGN ortho (es)');
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
    // the layer chosen in a test is stored: not for the next one
    afterEach(() => window.localStorage.removeItem('DocumentMap.preferences'));

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

    it('tilts the view with the rotation of the mouse (right button or Ctrl + drag)', async () => {
      const { wrapper, map } = await mountMap({ documents: [route], show3d: true });
      // MapLibre's default (true): with false, the mouse would only turn the view around the vertical
      expect(map.options.pitchWithRotate).not.toBe(false);
      wrapper.unmount();
    });

    it('keeps the button that pins the map to a side, the compass below it', async () => {
      const { wrapper, map } = await mountMap({ documents: [route], show3d: true, showPinToTopButton: true });

      await open3d(wrapper);

      expect(wrapper.find('.ol-control-pin-to-top').isVisible()).toBe(true);
      expect(wrapper.find('.c2c-map-compass').classes()).toContain('below-pin');

      // the page fits the map to its documents once pinned: the 3D view stays tilted on them
      map.cameras.length = 0;
      await (wrapper.vm as unknown as { fitMapToDocuments(): Promise<unknown> }).fitMapToDocuments();
      expect(map.cameras.at(-1)).toMatchObject({ pitch: 60 });
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

    it('keeps SwissTopo, drawn from its vector tiles, and gives the layer chosen in 3D back to 2D', async () => {
      const swissStyle = (raster?: boolean) => ({
        version: 8,
        glyphs: 'https://vectortiles.example/fonts/{fontstack}/{range}.pbf',
        sprite: [{ id: 'default', url: 'https://vectortiles.example/sprite' }],
        sources: {
          'base_v1.0.0': { type: 'vector', url: 'https://vectortiles.example/base.json' },
          ...(raster ? { swissimage: { type: 'raster', tiles: ['https://wmts.example/{z}/{x}/{y}.jpeg'] } } : {}),
        },
        layers: [
          { id: 'background', type: 'background' },
          ...(raster ? [{ id: 'swissimage', type: 'raster', source: 'swissimage' }] : []),
          { id: 'water', type: 'fill', source: 'base_v1.0.0', 'source-layer': 'water' },
          { id: 'peaks', type: 'symbol', source: 'base_v1.0.0', 'source-layer': 'mountain_peak' },
        ],
      });
      const fetch = vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (url) => Response.json(swissStyle(String(url).includes('imagerybasemap'))));
      const { wrapper, map } = await mountMap(
        { documents: [route], show3d: true, rememberSettings: true },
        '/routes/1/fr?layer=swiss'
      );
      const layerIds = () => map.style.layers.map((layer) => layer.id);

      await open3d(wrapper);

      // the raster map stays in 2D; in 3D, its vector tiles: the ground under our shading, the names over the slopes
      expect(selectedTitles(wrapper)[0]).toBe('SwissTopo');
      expect(map.layout.SwissTopo.visibility).toBe('none');
      expect(map.layout.world.visibility).toBe('visible');
      const ids = layerIds();
      expect(ids.indexOf('vector-ground')).toBeLessThan(ids.indexOf('shading'));
      expect(ids.indexOf('vector-water')).toBeLessThan(ids.indexOf('shading'));
      expect(ids.indexOf('vector-peaks')).toBeGreaterThan(ids.indexOf('SwissTopo Slopes'));
      expect(ids.indexOf('vector-peaks')).toBeLessThan(ids.indexOf('documents-3d'));
      expect(map.glyphs).toBe('https://vectortiles.example/fonts/{fontstack}/{range}.pbf');
      expect([...map.sprites.keys()]).toEqual(['default']);
      // no relief drawn on a vector map: our shading goes on with it
      expect(map.layout.shading.visibility).toBe('visible');

      // the orthophoto, with the names of swisstopo over it: the first map is removed
      await wrapper
        .findAll('.layer-button')
        .find((button) => button.text() === 'SwissTopo ortho')!
        .trigger('click');
      await flushPromises();
      expect(map.layout['SwissTopo ortho'].visibility).toBe('visible');
      expect(map.layout.shading.visibility).toBe('none');
      expect(layerIds().filter((id) => id.startsWith('vector-'))).toEqual(['vector-water', 'vector-peaks']);
      expect(Object.keys(map.style.sources).filter((id) => id.startsWith('vector-'))).toEqual(['vector-base_v1.0.0']);

      await wrapper.find('.ol-control-3d button').trigger('click');
      await flushPromises();
      expect(map.layout['SwissTopo ortho'].visibility).toBe('visible');
      expect(layerIds().filter((id) => id.startsWith('vector-'))).toEqual([]);
      expect(map.sprites.size).toBe(0);
      wrapper.unmount();
      fetch.mockRestore();
    });

    it('goes back to the 2D layer after the orthophoto that 3D chose by itself, and stores nothing', async () => {
      const { wrapper, map } = await mountMap(
        { documents: [{ ...route, areas: [{ document_id: 14274 }] }], show3d: true, rememberSettings: true },
        '/routes/1/fr'
      );

      await open3d(wrapper);
      expect(map.layout['IGN ortho'].visibility).toBe('visible');
      await wrapper.find('.ol-control-3d button').trigger('click');
      await flushPromises();
      expect(selectedTitles(wrapper)[0]).toBe('OpenTopoMap');
      expect(map.layout.OpenTopoMap.visibility).toBe('visible');
      expect(map.layout['IGN ortho'].visibility).toBe('none');
      expect(window.localStorage.getItem('DocumentMap.preferences')).toBeNull();
      wrapper.unmount();
    });

    it('keeps the category of a layer clicked in 3D, and shows its 2D layer back in 2D', async () => {
      const { wrapper, map } = await mountMap(
        { documents: [{ ...route, areas: [{ document_id: 14274 }] }], show3d: true, rememberSettings: true },
        '/routes/1/fr'
      );

      await open3d(wrapper);
      // the world orthophoto has no 2D layer: the orthophoto of the country in 2D
      await wrapper
        .findAll('.layer-button')
        .find((button) => button.text() === 'Sentinel-2')!
        .trigger('click');
      await flushPromises();
      expect(JSON.parse(window.localStorage.getItem('DocumentMap.preferences')!).settings).toEqual({
        category: 'ortho',
      });
      await wrapper.find('.ol-control-3d button').trigger('click');
      await flushPromises();
      expect(selectedTitles(wrapper)[0]).toBe('IGN ortho');
      expect(map.layout['IGN ortho'].visibility).toBe('visible');
      wrapper.unmount();
    });

    it('offers no relief layer in 3D', async () => {
      const { wrapper, map } = await mountMap({ documents: [route], show3d: true });

      await open3d(wrapper);
      expect(wrapper.findAll('.layer-button').map((button) => button.text())).not.toContain('Relief');
      expect(map.style.layers.map((layer) => layer.id)).not.toContain('relief');
      wrapper.unmount();
    });

    it('keeps the IGN maps in 3D, with no shading of ours over their own', async () => {
      const { wrapper, map } = await mountMap(
        { documents: [route], show3d: true, rememberSettings: true },
        '/routes/1/fr?layer=ign'
      );

      await open3d(wrapper);
      // the TOP 25 at every zoom, also far from the camera (small zooms)
      expect(map.layout['IGN maps'].visibility).toBe('none');
      expect(map.layout['IGN maps 3D'].visibility).toBe('visible');
      expect(map.style.sources['IGN maps 3D']).toMatchObject({ minzoom: 6, maxzoom: 16 });
      expect((map.style.sources['IGN maps 3D'] as { tiles: string[] }).tiles[0]).toMatch(
        /^https:\/\/data\.geopf\.fr\/private\/wmts\?apikey=/
      );
      expect((map.style.sources['IGN maps 3D'] as { tiles: string[] }).tiles[0]).toContain(
        'LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR&'
      );
      // a raster map with its own relief: our shading stays off
      expect(map.layout.shading.visibility).toBe('none');

      await wrapper.find('.ol-control-3d button').trigger('click');
      await flushPromises();
      expect(map.layout['IGN maps'].visibility).toBe('visible');
      expect(map.layout['IGN maps 3D'].visibility).toBe('none');
      wrapper.unmount();
    });

    it('shows the orthophoto of the country of the documents when the 2D layer has no 3D one', async () => {
      const { wrapper, map } = await mountMap(
        { documents: [{ ...route, areas: [{ document_id: 14274 }] }], show3d: true, rememberSettings: true },
        '/routes/1/fr?layer=esri'
      );

      await open3d(wrapper);
      // not the IGN maps, also allowed in 3D
      expect(map.layout['IGN ortho'].visibility).toBe('visible');
      expect(map.layout['IGN maps'].visibility).toBe('none');
      wrapper.unmount();
    });

    it('leaves our shading off when it was turned off on a vector map', async () => {
      const fetch = vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async () => Response.json({ version: 8, sources: {}, layers: [] }));
      const { wrapper, map } = await mountMap(
        { documents: [route], show3d: true, rememberSettings: true },
        '/routes/1/fr?layer=swiss'
      );
      const click = (title: string) =>
        wrapper
          .findAll('.layer-button')
          .find((button) => button.text() === title)!
          .trigger('click');

      await open3d(wrapper);
      await click('Shading');
      expect(map.layout.shading.visibility).toBe('none');
      await click('SwissTopo ortho');
      await click('Shading');
      await click('SwissTopo');
      await flushPromises();
      // turned on by hand: kept on the next map
      await click('SwissTopo ortho');
      expect(map.layout.shading.visibility).toBe('visible');
      wrapper.unmount();
      fetch.mockRestore();
    });

    it('shades the relief softly (igor), at 40% until its slider is moved', async () => {
      const { wrapper, map } = await mountMap({ documents: [route], show3d: true });

      await open3d(wrapper);
      await wrapper
        .findAll('.layer-button')
        .find((button) => button.text() === 'Shading')!
        .trigger('click');

      expect(map.layout.shading.visibility).toBe('visible');
      expect(map.style.layers.find((layer) => layer.id === 'shading')).toMatchObject({
        paint: { 'hillshade-method': 'igor' },
      });
      expect(map.paint.shading).toEqual({ 'hillshade-exaggeration': 0.4 });
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

    it('drops the waypoints read for the documents it no longer shows', async () => {
      let answer: (value: unknown) => void = () => {};
      vi.spyOn(c2c.route as DocumentService, 'get').mockReturnValue(
        new Promise((resolve) => (answer = resolve)) as never
      );
      const { wrapper } = await mountMap({ documents: [outing], show3d: true });
      await open3d(wrapper);

      await wrapper.setProps({ documents: [{ ...outing, document_id: 3, associations: {} }] });
      answer({ data: { associations: { waypoints: [waypoint(11, 'summit', 6.285)] } } });
      await flushPromises();

      expect(shownMarkers()).toHaveLength(0);
      wrapper.unmount();
    });

    describe('of a list of documents', () => {
      const pointOnly = { document_id: 2, type: 'o', activities: ['hiking'], geometry: { geom: point(6.5, 45.95) } };

      it('keeps the marker of a result without a track when another result has one', async () => {
        const { wrapper } = await mountMap({ documents: [outing, pointOnly], show3d: true });

        await open3d(wrapper);

        expect(shownMarkers()).toHaveLength(1);
        expect(shownMarkers()[0].lngLat![0]).toBeCloseTo(6.5, 6);
        wrapper.unmount();
      });

      it('keeps the filter on the extent of the map, with the box of what is seen', async () => {
        const { wrapper, map } = await mountMap({
          documents: [outing, pointOnly],
          show3d: true,
          showFilterControl: true,
        });
        await wrapper.find('#filter-documents-with-map').setValue(true);
        await open3d(wrapper);
        const push = vi.spyOn(wrapper.vm.$router, 'push');

        expect(wrapper.find('.ol-control-use-map-as-filter').isVisible()).toBe(true);
        map.extent = [6, 45, 7, 46];
        map.fire('moveend');
        await flushPromises();

        expect(push).toHaveBeenCalledWith({ query: { bbox: expect.stringMatching(/^\d+(,\d+){3}$/) } });
        wrapper.unmount();
      });

      it('filters in 3D with the box within the ground seen, its top lowered with the tilt', async () => {
        const { wrapper, map } = await mountMap({ documents: [outing], show3d: true, showFilterControl: true });
        await wrapper.find('#filter-documents-with-map').setValue(true);
        await open3d(wrapper);
        Object.defineProperties(map.getContainer(), { clientWidth: { value: 1000 }, clientHeight: { value: 500 } });
        // the ground seen: 5° deep, twice as wide at the top (far) as at the bottom (near)
        map.unproject = ([x, y]: [number, number]) => ({
          lng: ((x - 500) / 1000) * (1 + (500 - y) / 500),
          lat: (500 - y) / 100,
        });
        const push = vi.spyOn(wrapper.vm.$router, 'push');
        const sent = () =>
          extentToLonLat(
            String((push.mock.lastCall![0] as { query: LocationQueryRaw }).query.bbox)
              .split(',')
              .map(Number)
          );

        map.fire('moveend');
        await flushPromises();
        // tilted 60°: the top lowered by 15 / 40 of half the screen (y = 93.75), and as wide as the middle of what is
        // left, not as its top: the far corners left out
        [-0.703, 0, 0.703, 4.0625].forEach((value, i) => expect(sent()[i]).toBeCloseTo(value, 2));
        expect(map.data['filter-outline']).toMatchObject({ type: 'Polygon' });

        // tilted 80°: lowered further, by 35 / 40 (y = 218.75)
        map.pitch = 80;
        map.fire('moveend');
        await flushPromises();
        expect(sent()[3]).toBeCloseTo(2.8125, 2);
        wrapper.unmount();
      });

      it('goes back to 2D where it is, not to the view it left', async () => {
        const { wrapper, map } = await mountMap({ documents: [outing, pointOnly], show3d: true });
        map.zoom = 11;
        await open3d(wrapper);

        await wrapper.find('.ol-control-3d button').trigger('click');

        expect(map.cameras.at(-1)).toEqual({ pitch: 0, bearing: 0 });
        wrapper.unmount();
      });

      it('does not read the waypoints of the routes of its outings', async () => {
        const get = vi.spyOn(c2c.route as DocumentService, 'get');
        get.mockClear();
        const { wrapper } = await mountMap({ documents: [outing, pointOnly], show3d: true });

        await open3d(wrapper);

        expect(get).not.toHaveBeenCalled();
        wrapper.unmount();
      });
    });
  });
});
