import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { mountMap } from './test-utils';

import c2c from '@/js/apis/c2c';

const toast = vi.hoisted(() => vi.fn());
vi.mock('@/js/toast', () => ({ toast }));

// the point markers draw Font Awesome icons, which the specs don't load: plain styles instead
vi.mock('@/components/map/map-utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/map/map-utils')>()),
  getDocumentPointStyle: () => [],
}));

// the heatmap is a WebGL layer, which jsdom cannot create: a plain vector layer stands for it
vi.mock('@/components/map/density-overlays', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/components/map/density-overlays')>();
  const { default: VectorLayer } = await import('ol/layer/Vector');
  const { default: VectorSource } = await import('ol/source/Vector');
  return { ...original, createHeatmapLayer: () => new VectorLayer({ source: new VectorSource() }) };
});

const overlayButtons = (wrapper: Awaited<ReturnType<typeof mountMap>>['wrapper']) =>
  wrapper.findAll('.ol-control-layer-switcher .layer-button').filter((button) => /Outings|Routes/.test(button.text()));

describe('the Outings and Routes overlays of OlMap', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    toast.mockClear();
  });

  it('are offered in the layer switcher', async () => {
    const { wrapper } = await mountMap();

    expect(overlayButtons(wrapper).map((button) => button.text())).toEqual(['Outings', 'Routes']);

    wrapper.unmount();
  });

  it('are turned off, with a message, when the API says they are (503)', async () => {
    vi.spyOn(c2c, 'getOutingsHeatmap').mockImplementation(
      () => Promise.reject({ response: { status: 503 } }) as unknown as ReturnType<typeof c2c.getOutingsHeatmap>
    );
    const { wrapper } = await mountMap();

    await overlayButtons(wrapper)[0].trigger('click');
    // the request, then its failure
    await new Promise((resolve) => setTimeout(resolve));
    await nextTick();

    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast.mock.calls[0][0]).toMatchObject({ type: 'is-warning' });
    // no longer offered
    expect(overlayButtons(wrapper)).toHaveLength(0);

    wrapper.unmount();
  });

  it('ask the heatmap of the box, with no zoom, and a request that can be cancelled', async () => {
    const heatmap = vi
      .spyOn(c2c, 'getOutingsHeatmap')
      .mockImplementation(
        () => Promise.resolve({ data: { buckets: [] } }) as unknown as ReturnType<typeof c2c.getOutingsHeatmap>
      );
    const { wrapper } = await mountMap();

    await overlayButtons(wrapper)[0].trigger('click');
    await new Promise((resolve) => setTimeout(resolve));

    const [params, signal] = heatmap.mock.calls[0];
    expect(params).toHaveProperty('bbox');
    expect(params).not.toHaveProperty('zoom');
    expect(signal).toBeInstanceOf(AbortSignal);

    wrapper.unmount();
  });

  it('show the density when there are too many tracks to draw them', async () => {
    const tracks = vi
      .spyOn(c2c, 'getOutingsTracks')
      .mockImplementation(
        () =>
          Promise.resolve({ data: { documents: [], truncated: true } }) as unknown as ReturnType<
            typeof c2c.getOutingsTracks
          >
      );
    const heatmap = vi
      .spyOn(c2c, 'getOutingsHeatmap')
      .mockImplementation(
        () => Promise.resolve({ data: { buckets: [] } }) as unknown as ReturnType<typeof c2c.getOutingsHeatmap>
      );
    const { wrapper, vm } = await mountMap();
    // close enough to ask for the tracks
    vm.map.getView().setZoom(15);

    await overlayButtons(wrapper)[0].trigger('click');
    await new Promise((resolve) => setTimeout(resolve));

    expect(tracks).toHaveBeenCalledTimes(1);
    // the density of the same box, instead of an invitation to zoom in
    expect(heatmap).toHaveBeenCalledTimes(1);
    expect(heatmap.mock.calls[0][0]).toEqual({ bbox: expect.any(String) });
    expect(wrapper.text()).not.toContain('Zoom in to see all tracks');

    wrapper.unmount();
  });

  it('list the most recent documents when the density is clicked', async () => {
    const tracks = vi.spyOn(c2c, 'getOutingsTracks').mockImplementation((params: Record<string, unknown>) => {
      const documents = params.recent
        ? [
            {
              document_id: 1,
              type: 'o',
              title: 'Recent hike',
              date_end: '2026-11-01',
              activities: ['hiking'],
              geometry: {
                geom_detail: JSON.stringify({
                  type: 'LineString',
                  coordinates: [
                    [0, 0],
                    [10, 10],
                  ],
                }),
              },
            },
          ]
        : [];
      return Promise.resolve({
        data: { documents, truncated: true, count: 412, count_capped: false },
      }) as unknown as ReturnType<typeof c2c.getOutingsTracks>;
    });
    vi.spyOn(c2c, 'getOutingsHeatmap').mockImplementation(
      () => Promise.resolve({ data: { buckets: [] } }) as unknown as ReturnType<typeof c2c.getOutingsHeatmap>
    );
    const { wrapper, vm } = await mountMap();
    vm.map.getView().setZoom(15);
    await overlayButtons(wrapper)[0].trigger('click');
    await new Promise((resolve) => setTimeout(resolve));
    tracks.mockClear();

    vm.onClick({ pixel: [10, 10], coordinate: [100, 200], originalEvent: { pointerType: 'mouse' } });
    await new Promise((resolve) => setTimeout(resolve));
    await nextTick();

    // a small box around the click, the most recent ones
    expect(tracks).toHaveBeenCalledTimes(1);
    expect(tracks.mock.calls[0][0]).toMatchObject({ recent: 30, bbox: expect.stringMatching(/^-?\d+(,-?\d+){3}$/) });
    expect(wrapper.find('.ol-track-panel').text()).toContain('Recent hike');
    // more than the list
    expect(wrapper.find('.ol-track-panel').text()).toContain('Only the most recent ones are listed');
    // how many there are
    expect(wrapper.find('.ol-track-panel').text()).toContain('(412)');

    wrapper.unmount();
  });

  it('keep the last click: the answer of an older one does not replace it', async () => {
    const line = JSON.stringify({
      type: 'LineString',
      coordinates: [
        [0, 0],
        [10, 10],
      ],
    });
    const answer = (title: string) => ({
      data: { documents: [{ document_id: 1, type: 'o', title, geometry: { geom_detail: line } }], truncated: true },
    });
    let releaseOld: (value: unknown) => void = () => undefined;
    const calls: string[] = [];
    vi.spyOn(c2c, 'getOutingsTracks').mockImplementation((params: Record<string, unknown>) => {
      if (!params.recent) {
        return Promise.resolve({ data: { documents: [], truncated: true } }) as never;
      }
      calls.push('lookup');
      // the first lookup is slow, the second one is fast
      return (
        calls.length === 1
          ? new Promise((resolve) => (releaseOld = () => resolve(answer('Old'))))
          : Promise.resolve(answer('New'))
      ) as never;
    });
    vi.spyOn(c2c, 'getOutingsHeatmap').mockImplementation(
      () => Promise.resolve({ data: { buckets: [] } }) as unknown as ReturnType<typeof c2c.getOutingsHeatmap>
    );
    const { wrapper, vm } = await mountMap();
    vm.map.getView().setZoom(15);
    await overlayButtons(wrapper)[0].trigger('click');
    await new Promise((resolve) => setTimeout(resolve));

    const click = { pixel: [10, 10], coordinate: [100, 200], originalEvent: { pointerType: 'mouse' } };
    vm.onClick(click);
    vm.onClick(click);
    await new Promise((resolve) => setTimeout(resolve));
    releaseOld(undefined);
    await new Promise((resolve) => setTimeout(resolve));
    await nextTick();

    expect(wrapper.find('.ol-track-panel').text()).toContain('New');
    expect(wrapper.find('.ol-track-panel').text()).not.toContain('Old');

    wrapper.unmount();
  });

  it('stay on when the request fails for another reason', async () => {
    vi.spyOn(c2c, 'getOutingsHeatmap').mockImplementation(
      () => Promise.reject({ response: { status: 500 } }) as unknown as ReturnType<typeof c2c.getOutingsHeatmap>
    );
    const { wrapper } = await mountMap();

    await overlayButtons(wrapper)[0].trigger('click');
    await new Promise((resolve) => setTimeout(resolve));
    await nextTick();

    expect(toast).not.toHaveBeenCalled();
    expect(overlayButtons(wrapper)).toHaveLength(2);

    wrapper.unmount();
  });
});
