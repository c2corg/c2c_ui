import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import PartnerOutingsMap from './PartnerOutingsMap.vue';
import { c2cOuting, geometry, partnerOuting, track } from './fixtures';
import { type OutingMarker, markersOf } from './partner-outings-map';

import { type FakeMap, FakeMarker, resetMocks, state } from '@/components/map/maplibre-mock';

vi.mock('maplibre-gl', async () => ({
  ...(await import('@/components/map/maplibre-mock')),
  NavigationControl: class {},
  LngLatBounds: class {
    points: number[][] = [];
    extend(point: number[]) {
      this.points.push(point);
      return this;
    }
  },
}));
vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?url', () => ({ default: '' }));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));
vi.mock('@/components/map/map-documents', () => ({ getDocumentIcon: () => ({ svgSrc: 'outing.svg', color: '#F93' }) }));

const markers = (): OutingMarker[] =>
  markersOf([
    partnerOuting({ id: 'skitour:1', source: 'skitour', title: 'Exact', geometry: geometry('start') }),
    partnerOuting({ id: 'gulliver:2', title: 'Roughly', geometry: geometry('area_centroid', 710000, 5760000) }),
    c2cOuting({ geometry: geometry('route', 720000, 5770000) }),
  ]).markers;

const mountMap = (props: Record<string, unknown> = {}) =>
  mount(PartnerOutingsMap, {
    props: { markers: markers(), ...props },
    global: {
      config: { globalProperties: { $gettext: (text: string) => text } as never },
      directives: { translate: () => {} },
    },
  });

const drawn = (): FakeMarker[] => state.markers.filter((marker) => !marker.removed);
const map = () => state.maps[0] as FakeMap;

beforeEach(() => resetMocks());

describe('PartnerOutingsMap', () => {
  it('puts a marker on each outing, at its place', () => {
    mountMap();
    expect(drawn()).toHaveLength(3);
    expect(drawn().every((marker) => marker.added)).toBe(true);
    expect(drawn()[0].lngLat![0]).toBeCloseTo(6.289, 2);
  });

  it('colours the markers by source and styles the approximate ones apart, with a tooltip', () => {
    mountMap();
    const [exact, rough, c2c] = drawn().map((marker) => marker.element!);
    expect(exact.dataset.source).toBe('skitour');
    expect(exact.classList.contains('is-approximate')).toBe(false);
    expect(exact.title).toBe('Exact');
    expect(exact.querySelector<HTMLElement>('.outing-marker-dot')!.style.getPropertyValue('--marker-color')).toBe(
      '#1c5a8c'
    );
    expect(rough.classList.contains('is-approximate')).toBe(true);
    expect(rough.title).toBe('Roughly (approximate location)');
    // c2c: its colour and the outing icon
    expect(c2c.classList.contains('outing-marker--c2c')).toBe(true);
    expect(c2c.querySelector('img')!.getAttribute('src')).toBe('outing.svg');
  });

  it('explains the colours, and the approximate style only when there are approximate markers', async () => {
    const wrapper = mountMap();
    expect(wrapper.find('[data-test=legend]').text()).toContain('Skitour');
    expect(wrapper.find('[data-test=legend]').text()).toContain('Gulliver');
    expect(wrapper.find('[data-test=legend-approximate]').exists()).toBe(true);

    await wrapper.setProps({ markers: markers().filter((m) => !m.approximate) });
    expect(wrapper.find('[data-test=legend-approximate]').exists()).toBe(false);
  });

  it('highlights the marker of the outing named by the list, and the list is told of the hover on a marker', async () => {
    const wrapper = mountMap({ highlightedId: 'gulliver:2' });
    const elements = () => drawn().map((marker) => marker.element!);
    expect(elements().map((e) => e.classList.contains('is-highlighted'))).toEqual([false, true, false]);

    await wrapper.setProps({ highlightedId: null });
    expect(elements().some((e) => e.classList.contains('is-highlighted'))).toBe(false);

    elements()[0].dispatchEvent(new MouseEvent('mouseenter'));
    elements()[0].dispatchEvent(new MouseEvent('mouseleave'));
    expect(wrapper.emitted('highlight')).toEqual([['skitour:1'], [null]]);
  });

  it('tells which outing a click on its marker selects', () => {
    const wrapper = mountMap();
    drawn()[1].element!.click();
    expect(wrapper.emitted('select')).toEqual([['gulliver:2']]);
  });

  it('draws the markers again when the outings change', async () => {
    const wrapper = mountMap();
    const first = [...drawn()];
    await wrapper.setProps({ markers: markers().slice(0, 1) });
    expect(first.every((marker) => marker.removed)).toBe(true);
    expect(drawn()).toHaveLength(1);
  });

  it('shows the outings on load, but when it is filtered by its extent, which the user chose', async () => {
    mountMap();
    await Promise.resolve();
    await Promise.resolve();
    expect(map().cameras.some((camera) => 'bounds' in camera)).toBe(true);

    resetMocks();
    mountMap({ filterByExtent: true, initialExtent: [700000, 5700000, 800000, 5800000] });
    await Promise.resolve();
    await Promise.resolve();
    // only the extent of the link
    expect(map().cameras).toHaveLength(1);
  });

  it('keeps the extent of the link: the filter the page turns on for it does not send the default extent', async () => {
    const wrapper = mountMap({ initialExtent: [700000, 5700000, 800000, 5800000] });
    await wrapper.setProps({ filterByExtent: true });
    expect(wrapper.emitted('extent-change')).toBeUndefined();
  });

  it('gives the extent in EPSG:3857 after a move of the user, when it filters', () => {
    const wrapper = mountMap({ filterByExtent: true });
    map().fire('moveend', {});
    expect(wrapper.emitted('extent-change')).toBeUndefined();
    map().fire('moveend', { originalEvent: new Event('mouseup') });
    const sent = wrapper.emitted('extent-change')![0][0] as number[];
    expect(sent).toHaveLength(4);
    expect(sent.every(Number.isInteger)).toBe(true);
    expect(sent[0]).toBeLessThan(sent[2]);
    expect(sent[1]).toBeLessThan(sent[3]);
  });

  it('does not filter on a move when the filter is off', () => {
    const wrapper = mountMap();
    map().fire('moveend', { originalEvent: new Event('mouseup') });
    expect(wrapper.emitted('extent-change')).toBeUndefined();
  });

  it('gives its extent when the filter is turned on, and tells when the user changes it', async () => {
    const wrapper = mountMap();
    const input = wrapper.find<HTMLInputElement>('[data-test=filter-extent]');
    input.element.checked = true;
    await input.trigger('change');
    expect(wrapper.emitted('update:filterByExtent')).toEqual([[true]]);
    await wrapper.setProps({ filterByExtent: true });
    expect(wrapper.emitted('extent-change')).toHaveLength(1);

    input.element.checked = false;
    await input.trigger('change');
    expect(wrapper.emitted('update:filterByExtent')).toEqual([[true], [false]]);
  });

  it('says so when the map cannot be made', async () => {
    state.webgl = false;
    const wrapper = mountMap();
    await nextTick();
    expect(wrapper.find('[data-test=map-unsupported]').exists()).toBe(true);
    expect(drawn()).toHaveLength(0);
  });

  it('removes the map and its markers with the component', () => {
    const wrapper = mountMap();
    wrapper.unmount();
    expect(map().removed).toBe(true);
    expect(drawn()).toHaveLength(0);
  });

  describe('track', () => {
    const lines = () => map().style.layers.filter((layer) => layer.id.startsWith('partner-track'));

    it('draws the track it is given once the map is loaded, in the colour of the source, with its credit', async () => {
      const wrapper = mountMap({ track: track() });
      await flushPromises();
      expect(map().style.sources['partner-track']).toMatchObject({ type: 'geojson', data: track() });
      expect(lines().map((layer) => layer.id)).toEqual(['partner-track-casing', 'partner-track']);
      expect(map().getLayer('partner-track')).toMatchObject({ paint: { 'line-color': '#1f6a35' } });
      const credit = wrapper.find('[data-test=track-credit]');
      expect(credit.text()).toBe('Track: Marco on gulliver.it (CC BY-SA 4.0)');
      expect(credit.find('a').attributes()).toMatchObject({
        href: 'https://gulliver.it/gita/1/',
        target: '_blank',
        rel: 'noopener noreferrer',
      });
    });

    it('replaces the track, and removes it when there is none', async () => {
      const wrapper = mountMap();
      await flushPromises();
      expect(map().style.sources['partner-track']).toBeUndefined();
      expect(wrapper.find('[data-test=track-credit]').exists()).toBe(false);

      await wrapper.setProps({ track: track({ source: 'skitour', attribution: null, licence: null, url: null }) });
      expect(map().getLayer('partner-track')).toMatchObject({ paint: { 'line-color': '#1c5a8c' } });
      expect(wrapper.find('[data-test=track-credit]').text()).toBe('Track: Marco');
      expect(wrapper.find('[data-test=track-credit] a').exists()).toBe(false);

      await wrapper.setProps({ track: null });
      expect(lines()).toEqual([]);
      expect(map().style.sources['partner-track']).toBeUndefined();
      expect(wrapper.find('[data-test=track-credit]').exists()).toBe(false);
    });
  });
});
