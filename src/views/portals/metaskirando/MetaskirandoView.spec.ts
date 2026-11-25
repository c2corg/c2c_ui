import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import MetaskirandoView from './MetaskirandoView.vue';
import { c2cOuting, geometry, partnerOuting, sources } from './fixtures';

import { usePartnerOutingsStore } from '@/stores/partner-outings';

const getAll = vi.hoisted(() => vi.fn());
const getSources = vi.hoisted(() => vi.fn());
vi.mock('@/js/apis/partner-outings-service', () => ({ default: { getAll, getSources } }));
vi.mock('@/js/apis/c2c', () => ({
  default: {
    area: { get: vi.fn((id: number) => Promise.resolve({ data: { document_id: id, type: 'a', locales: [] } })) },
  },
}));

const route = reactive({ query: {} as Record<string, string> });
const replace = vi.hoisted(() => vi.fn());
vi.mock('vue-router', async (original) => ({
  ...(await original<typeof import('vue-router')>()),
  useRoute: () => route,
  useRouter: () => ({ replace }),
}));

const answer = (items = [c2cOuting(), partnerOuting(), partnerOuting({ id: 'gulliver:2', date: '2026-02-13' })]) => ({
  total: items.length,
  items,
  sources,
});

// unmounted after each test: a page left mounted would also react to the route of the next one
const mounted: { unmount(): void }[] = [];
const mountView = () => {
  const wrapper = shallowMount(MetaskirandoView, {
    global: {
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $language: { current: 'fr' },
          $dateUtils: { toLocalizedString: (date: string) => `day ${date}`, timeAgo: () => '3 hours ago' },
          $filters: { uppercaseFirstLetter: (text: string) => text },
        } as never,
      },
      stubs: {
        PartnerOutingRow: { props: ['outing'], template: '<div class="row">{{ outing.id }}</div>' },
        PartnerOutingsMap: {
          name: 'PartnerOutingsMap',
          props: ['markers', 'highlightedId', 'filterByExtent', 'initialExtent'],
          methods: { resize: () => {} },
          template: '<div class="map" />',
        },
      },
    },
  });
  mounted.push(wrapper);
  return wrapper;
};

afterEach(() => mounted.splice(0).forEach((wrapper) => wrapper.unmount()));

beforeEach(() => {
  getAll.mockReset();
  getAll.mockResolvedValue(answer());
  getSources.mockReset();
  getSources.mockResolvedValue([
    {
      source: 'gulliver',
      status: 'ok',
      last_success_at: null,
      site_name: 'gulliver.it',
      site_url: 'https://www.gulliver.it',
    },
    { source: 'skitour', status: 'ok', last_success_at: null, site_name: 'skitour.fr', site_url: 'https://skitour.fr' },
  ]);
  replace.mockReset();
  route.query = {};
});

describe('MetaskirandoView', () => {
  it('groups the outings by date, the newest first, under a date header', async () => {
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.findAll('[data-test="date"]').map((h) => h.text())).toEqual(['day 2026-02-14', 'day 2026-02-13']);
    const days = wrapper.findAll('[data-test="day"]');
    expect(days[0].findAll('.row').map((r) => r.text())).toEqual(['c2c:77', 'gulliver:1']);
    expect(days[1].findAll('.row').map((r) => r.text())).toEqual(['gulliver:2']);
  });

  it('loads with the filters of the route query and the language', async () => {
    route.query = { a: '14,15', act: 'skitouring' };
    mountView();
    await flushPromises();
    expect(getAll).toHaveBeenCalledWith({ a: [14, 15], act: ['skitouring'], pl: 'fr' }, expect.anything());
  });

  it('shows a loading state, then the list', async () => {
    const wrapper = mountView();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="loading"]').exists()).toBe(true);
    await flushPromises();
    expect(wrapper.find('[data-test="loading"]').exists()).toBe(false);
  });

  it('shows the empty state', async () => {
    getAll.mockResolvedValue(answer([]));
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.find('[data-test="empty"]').text()).toBe('No outing for these filters');
  });

  it('shows an error, not the empty state, when the request fails', async () => {
    getAll.mockRejectedValue(new Error('boom'));
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.find('[data-test="error"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="empty"]').exists()).toBe(false);
  });

  it('shows the health of every source: last update, or unavailable', async () => {
    const wrapper = mountView();
    await flushPromises();
    const lines = wrapper.findAll('[data-test="sources"] li').map((li) => li.text().replace(/\s+/g, ' '));
    expect(lines).toEqual(['gulliver.it: Last updated 3 hours ago', 'skitour.fr: Source unavailable']);
  });

  it('names the sources from the list of sources, linked to their site', async () => {
    const wrapper = mountView();
    await flushPromises();
    const links = wrapper.findAll('[data-test="sources"] a');
    expect(links.map((a) => [a.text(), a.attributes('href')])).toEqual([
      ['gulliver.it', 'https://www.gulliver.it'],
      ['skitour.fr', 'https://skitour.fr'],
    ]);
  });

  it('falls back to the ids of the sources when the list of sources does not load', async () => {
    getSources.mockRejectedValue(new Error('boom'));
    usePartnerOutingsStore().sourceSites = {};
    getAll.mockResolvedValue({ ...answer(), sources: sources.map((source) => ({ ...source, site_name: undefined })) });
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.findAll('[data-test="sources"] a')).toHaveLength(0);
    expect(wrapper.findAll('[data-test="sources"] li').map((li) => li.text().split(':')[0])).toEqual([
      'gulliver',
      'skitour',
    ]);
  });

  it('treats a degraded source as available, and a blocked one as unavailable', async () => {
    getAll.mockResolvedValue({
      ...answer(),
      sources: [
        { source: 'gulliver', status: 'degraded', last_success_at: '2026-02-14T09:00:00Z', site_name: 'Gulliver' },
        { source: 'skitour', status: 'blocked', last_success_at: '2026-02-10T09:00:00Z', site_name: 'Skitour' },
      ],
    });
    const wrapper = mountView();
    await flushPromises();
    const lines = wrapper.findAll('[data-test="sources"] li').map((li) => li.text().replace(/\s+/g, ' '));
    expect(lines).toEqual(['gulliver.it: Last updated 3 hours ago', 'skitour.fr: Source unavailable']);
  });

  it('puts a changed filter in the route query and loads again', async () => {
    const wrapper = mountView();
    await flushPromises();
    getAll.mockClear();

    const activity = wrapper.findComponent({ name: 'InputActivity' });
    activity.vm.$emit('update:modelValue', ['skitouring', 'hiking']);
    await flushPromises();

    expect(usePartnerOutingsStore().filters.activities).toEqual(['skitouring', 'hiking']);
    expect(replace).toHaveBeenCalledWith({ query: { act: 'skitouring,hiking' } });
    expect(getAll).toHaveBeenCalledTimes(1);
    expect(getAll.mock.calls[0][0]).toMatchObject({ act: ['skitouring', 'hiking'] });
  });

  it('puts the selected areas in the query as ids', async () => {
    const wrapper = mountView();
    await flushPromises();
    wrapper.findComponent({ name: 'InputDocument' }).vm.$emit('update:modelValue', [{ document_id: 14 }]);
    await flushPromises();
    expect(replace).toHaveBeenCalledWith({ query: { a: '14' } });
  });

  it('shows the selected areas, and removes one from the filter', async () => {
    const wrapper = mountView();
    await flushPromises();
    wrapper
      .findComponent({ name: 'InputDocument' })
      .vm.$emit('update:modelValue', [{ document_id: 14 }, { document_id: 15 }]);
    await flushPromises();
    expect(wrapper.findAll('[data-test="areas"] .tag')).toHaveLength(2);

    await wrapper.find('[data-test="areas"] .tag .delete').trigger('click');
    await flushPromises();
    expect(wrapper.findAll('[data-test="areas"] .tag')).toHaveLength(1);
    expect(replace).toHaveBeenLastCalledWith({ query: { a: '15' } });
  });

  describe('map', () => {
    const located = () =>
      answer([
        c2cOuting({ geometry: geometry('route') }),
        partnerOuting({ geometry: geometry('start') }),
        partnerOuting({ id: 'gulliver:2', date: '2026-02-13', geometry: geometry('area_centroid') }),
        partnerOuting({ id: 'gulliver:3', date: '2026-02-13', geometry: null }),
      ]);
    const mapOf = (wrapper: ReturnType<typeof mountView>) => wrapper.findComponent({ name: 'PartnerOutingsMap' });

    afterEach(() => vi.useRealTimers());

    it('gives the map the outings that have a location, and says how many have none', async () => {
      getAll.mockResolvedValue(located());
      const wrapper = mountView();
      await flushPromises();
      const markers = mapOf(wrapper).props('markers') as { outing: { id: string }; approximate: boolean }[];
      expect(markers.map((m) => [m.outing.id, m.approximate])).toEqual([
        ['c2c:77', false],
        ['gulliver:1', false],
        ['gulliver:2', true],
      ]);
      expect(wrapper.find('[data-test="without-location"]').text()).toBe('1 outing without location');
    });

    it('counts the outings without location, and says nothing when all have one', async () => {
      getAll.mockResolvedValue(answer([partnerOuting(), partnerOuting({ id: 'gulliver:2' })]));
      const wrapper = mountView();
      await flushPromises();
      expect(wrapper.find('[data-test="without-location"]').text()).toBe('2 outings without location');

      getAll.mockResolvedValue(answer([partnerOuting({ geometry: geometry() })]));
      await usePartnerOutingsStore().load();
      await flushPromises();
      expect(wrapper.find('[data-test="without-location"]').exists()).toBe(false);
    });

    it('highlights the marker of a row under the pointer, and the row of a marker', async () => {
      getAll.mockResolvedValue(located());
      const wrapper = mountView();
      await flushPromises();

      const rows = wrapper.findAll('.row');
      await rows[1].trigger('mouseenter');
      expect(mapOf(wrapper).props('highlightedId')).toBe('gulliver:1');
      expect(rows[1].classes()).toContain('is-highlighted');
      await rows[1].trigger('mouseleave');
      expect(mapOf(wrapper).props('highlightedId')).toBeNull();

      mapOf(wrapper).vm.$emit('highlight', 'gulliver:2');
      await flushPromises();
      expect(wrapper.findAll('.row').map((r) => r.classes().includes('is-highlighted'))).toEqual([
        false,
        false,
        true,
        false,
      ]);
    });

    it('scrolls to the row of a marker that is clicked', async () => {
      getAll.mockResolvedValue(located());
      const wrapper = mountView();
      await flushPromises();
      const scrollIntoView = vi.fn();
      const target = wrapper.findAll('.row')[2].element as HTMLElement;
      target.scrollIntoView = scrollIntoView;

      mapOf(wrapper).vm.$emit('select', 'gulliver:2');
      await flushPromises();
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(wrapper.findAll('.row')[2].classes()).toContain('is-selected');
    });

    it('searches with the extent of the map once it stopped moving, and the URL follows', async () => {
      vi.useFakeTimers();
      const wrapper = mountView();
      await flushPromises();
      expect(mapOf(wrapper).props('filterByExtent')).toBe(false);
      getAll.mockClear();

      mapOf(wrapper).vm.$emit('update:filterByExtent', true);
      mapOf(wrapper).vm.$emit('extent-change', [1, 2, 3, 4]);
      mapOf(wrapper).vm.$emit('extent-change', [10, 20, 30, 40]);
      await vi.advanceTimersByTimeAsync(400);

      expect(getAll).toHaveBeenCalledTimes(1);
      expect(getAll.mock.calls[0][0]).toMatchObject({ bbox: [10, 20, 30, 40] });
      expect(replace).toHaveBeenLastCalledWith({ query: { bbox: '10,20,30,40' } });
      expect(usePartnerOutingsStore().filters.bbox).toEqual([10, 20, 30, 40]);
    });

    it('keeps the extent when another filter changes, and drops it when the filter is turned off', async () => {
      route.query = { bbox: '1,2,3,4' };
      const wrapper = mountView();
      await flushPromises();
      expect(mapOf(wrapper).props('filterByExtent')).toBe(true);
      expect(mapOf(wrapper).props('initialExtent')).toEqual([1, 2, 3, 4]);
      expect(getAll.mock.calls[0][0]).toMatchObject({ bbox: [1, 2, 3, 4] });

      wrapper.findComponent({ name: 'InputActivity' }).vm.$emit('update:modelValue', ['hiking']);
      await flushPromises();
      expect(replace).toHaveBeenLastCalledWith({ query: { act: 'hiking', bbox: '1,2,3,4' } });

      getAll.mockClear();
      mapOf(wrapper).vm.$emit('update:filterByExtent', false);
      await flushPromises();
      expect(replace).toHaveBeenLastCalledWith({ query: { act: 'hiking' } });
      expect(getAll.mock.calls[0][0].bbox).toBeUndefined();
      expect(mapOf(wrapper).props('filterByExtent')).toBe(false);
    });

    it('shows the results and the map side by side, and the toggle of a phone keeps it in the URL', async () => {
      const wrapper = mountView();
      await flushPromises();
      expect(wrapper.find('.documents-container').exists()).toBe(true);
      expect(mapOf(wrapper).exists()).toBe(true);
      expect(wrapper.find('.result-section').classes()).toContain('mobile-mode-both');

      await wrapper.find('[data-test="map-toggle"]').trigger('click');
      expect(replace).toHaveBeenLastCalledWith({ query: { view: 'map' } });
      expect(wrapper.find('.documents-container').exists()).toBe(false);
      expect(wrapper.find('.result-section').classes()).toContain('fills-window');

      await wrapper.find('[data-test="map-toggle"]').trigger('click');
      expect(replace).toHaveBeenLastCalledWith({ query: {} });
      expect(wrapper.find('.documents-container').exists()).toBe(true);
    });

    it('reads the display mode of the link', async () => {
      route.query = { view: 'result' };
      const wrapper = mountView();
      await flushPromises();
      expect(mapOf(wrapper).exists()).toBe(false);
      expect(wrapper.find('.documents-container').classes()).toContain('is-12');
    });
  });
});
