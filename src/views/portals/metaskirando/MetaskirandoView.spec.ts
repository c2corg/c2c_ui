import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import MetaskirandoView from './MetaskirandoView.vue';
import { c2cOuting, geometry, partnerOuting, sources } from './fixtures';

import { emptyFilters, usePartnerOutingsStore } from '@/stores/partner-outings';

const getAll = vi.hoisted(() => vi.fn());
const getSources = vi.hoisted(() => vi.fn());
vi.mock('@/js/apis/partner-outings-service', () => ({ default: { getAll, getSources } }));
const getPreferences = vi.hoisted(() => vi.fn());
vi.mock('@/js/apis/c2c', () => ({
  default: {
    area: { get: vi.fn((id: number) => Promise.resolve({ data: { document_id: id, type: 'a', locales: [] } })) },
    userProfile: { preferences: { get: getPreferences } },
  },
}));
const user = vi.hoisted(() => ({ isLogged: false }));
vi.mock('@/stores/user', () => ({ useUserStore: () => user }));

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
        RouterLink: { template: '<a class="router-link"><slot /></a>' },
        SourceBadge: { props: ['source'], template: '<span>{{ source }}</span>' },
        PartnerOutingRow: {
          props: ['outing', 'isNew'],
          template: '<div class="row" :class="{ new: isNew }">{{ outing.id }}</div>',
        },
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
  getPreferences.mockReset();
  getPreferences.mockResolvedValue({ data: { activities: ['skitouring'], areas: [] } });
  user.isLogged = false;
  window.localStorage.clear();
  const store = usePartnerOutingsStore();
  store.filters = emptyFilters();
  store.onlyNew = false;
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

  describe('filters', () => {
    it('loads every activity by default, with no steep nor source filter', async () => {
      mountView();
      await flushPromises();
      const query = getAll.mock.calls[0][0];
      expect(query.act).toEqual([]);
      expect(query.steep).toBeUndefined();
      expect(query.sources).toBeUndefined();
    });

    it('reads steep, the sources and the text of the link', async () => {
      route.query = { steep: '1', sources: 'c2c,gulliver', q: 'monte' };
      const wrapper = mountView();
      await flushPromises();
      expect(getAll.mock.calls[0][0]).toMatchObject({ steep: true, sources: ['c2c', 'gulliver'] });
      expect((wrapper.find('[data-test="steep"]').element as HTMLInputElement).checked).toBe(true);
      expect((wrapper.find('[data-test="text-filter"]').element as HTMLInputElement).value).toBe('monte');
      expect(wrapper.findAll('.row').map((r) => r.text())).toEqual(['gulliver:1', 'gulliver:2'].filter((id) => id));
    });

    it('puts the steep toggle in the query and loads again', async () => {
      const wrapper = mountView();
      await flushPromises();
      getAll.mockClear();
      await wrapper.find('[data-test="steep"]').setValue(true);
      await flushPromises();
      expect(replace).toHaveBeenLastCalledWith({ query: { steep: '1' } });
      expect(getAll.mock.calls[0][0]).toMatchObject({ steep: true });
      await wrapper.find('[data-test="steep"]').setValue(false);
      await flushPromises();
      expect(replace).toHaveBeenLastCalledWith({ query: {} });
      expect(getAll.mock.calls[1][0].steep).toBeUndefined();
    });

    it('shows a chip per source, c2c first, all on, and a click filters the sources', async () => {
      const wrapper = mountView();
      await flushPromises();
      const chips = wrapper.findAll('[data-test="source-chips"] .source-chip');
      expect(chips.map((chip) => chip.attributes('data-source'))).toEqual(['c2c', 'gulliver', 'skitour']);
      expect(chips.map((chip) => chip.attributes('aria-pressed'))).toEqual(['true', 'true', 'true']);

      getAll.mockClear();
      await chips[2].trigger('click');
      await flushPromises();
      expect(replace).toHaveBeenLastCalledWith({ query: { sources: 'c2c,gulliver' } });
      expect(getAll.mock.calls[0][0]).toMatchObject({ sources: ['c2c', 'gulliver'] });
      expect(wrapper.findAll('[data-test="source-chips"] .source-chip').map((c) => c.classes('is-off'))).toEqual([
        false,
        false,
        true,
      ]);
    });

    it('filters the loaded outings with the text, without a request, and the URL follows', async () => {
      const wrapper = mountView();
      await flushPromises();
      getAll.mockClear();

      await wrapper.find('[data-test="text-filter"]').setValue('chalune');
      expect(wrapper.findAll('.row').map((r) => r.text())).toEqual(['c2c:77']);
      expect(replace).toHaveBeenLastCalledWith({ query: { q: 'chalune' } });
      expect(getAll).not.toHaveBeenCalled();

      await wrapper.find('[data-test="text-filter"]').setValue('nothing like it');
      expect(wrapper.find('[data-test="empty"]').exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'PartnerOutingsMap' }).props('markers')).toEqual([]);
    });

    it('keeps steep, the sources and the text when another filter changes', async () => {
      route.query = { steep: '1', sources: 'c2c', q: 'x' };
      const wrapper = mountView();
      await flushPromises();
      wrapper.findComponent({ name: 'InputActivity' }).vm.$emit('update:modelValue', ['hiking']);
      await flushPromises();
      expect(replace).toHaveBeenLastCalledWith({ query: { act: 'hiking', steep: '1', sources: 'c2c', q: 'x' } });
    });

    it('follows the back button: a query without the filters clears them', async () => {
      route.query = { steep: '1', q: 'x' };
      const wrapper = mountView();
      await flushPromises();
      getAll.mockClear();
      route.query = {};
      await flushPromises();
      expect(usePartnerOutingsStore().filters).toEqual(emptyFilters());
      expect((wrapper.find('[data-test="steep"]').element as HTMLInputElement).checked).toBe(false);
      expect(getAll).toHaveBeenCalledTimes(1);
    });

    it('works together with the extent of the map', async () => {
      route.query = { bbox: '1,2,3,4', steep: '1' };
      mountView();
      await flushPromises();
      expect(getAll.mock.calls[0][0]).toMatchObject({ bbox: [1, 2, 3, 4], steep: true });
    });
  });

  describe('preferred areas', () => {
    it('opens a logged-in user on the preferred areas of the account, in the query', async () => {
      user.isLogged = true;
      getPreferences.mockResolvedValue({
        data: { activities: ['skitouring'], areas: [{ document_id: 14409, type: 'a', locales: [] }] },
      });
      const wrapper = mountView();
      await flushPromises();
      // the areas, not the activities of the preferences: the list covers every activity
      expect(getAll).toHaveBeenCalledTimes(1);
      expect(getAll.mock.calls[0][0]).toMatchObject({ a: [14409], act: [] });
      expect(replace).toHaveBeenCalledWith({ query: { a: '14409' } });
      expect(wrapper.findAll('[data-test="areas"] .tag')).toHaveLength(1);
      expect(wrapper.find('[data-test="preferred-areas"]').exists()).toBe(true);
    });

    it('leaves a link with areas, or an extent, as it is', async () => {
      user.isLogged = true;
      route.query = { a: '15' };
      mountView();
      await flushPromises();
      expect(getPreferences).not.toHaveBeenCalled();
      expect(getAll.mock.calls[0][0]).toMatchObject({ a: [15] });

      getAll.mockClear();
      route.query = { bbox: '1,2,3,4' };
      mountView();
      await flushPromises();
      expect(getPreferences).not.toHaveBeenCalled();
    });

    it('opens on all the areas when the preferences cannot be read or hold none', async () => {
      user.isLogged = true;
      getPreferences.mockRejectedValue(new Error('boom'));
      mountView();
      await flushPromises();
      expect(getAll.mock.calls[0][0].a).toEqual([]);
    });

    it('uses the areas an anonymous visitor remembered', async () => {
      window.localStorage.setItem('metaskirando.areas', JSON.stringify([14409]));
      mountView();
      await flushPromises();
      expect(getPreferences).not.toHaveBeenCalled();
      expect(getAll.mock.calls[0][0]).toMatchObject({ a: [14409] });
      expect(replace).toHaveBeenCalledWith({ query: { a: '14409' } });
    });

    it('lets an anonymous visitor remember the selected areas, and forget them', async () => {
      const wrapper = mountView();
      await flushPromises();
      expect(wrapper.find('[data-test="remember-areas"]').exists()).toBe(false);

      wrapper.findComponent({ name: 'InputDocument' }).vm.$emit('update:modelValue', [{ document_id: 14 }]);
      await flushPromises();
      await wrapper.find('[data-test="remember-areas"]').trigger('click');
      expect(JSON.parse(window.localStorage.getItem('metaskirando.areas')!)).toEqual([14]);
      expect(wrapper.find('[data-test="remember-areas"]').text()).toBe('Forget my default areas');

      await wrapper.find('[data-test="remember-areas"]').trigger('click');
      expect(window.localStorage.getItem('metaskirando.areas')).toBeNull();
    });

    it('still opens when the local storage is blocked', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      mountView();
      await flushPromises();
      expect(getAll).toHaveBeenCalledTimes(1);
      vi.restoreAllMocks();
    });
  });

  describe('new since last visit', () => {
    it('tags the outings a source did not show at the previous visit, and can show only them', async () => {
      // the previous visit, long ago: gulliver showed its outing 1
      window.localStorage.setItem(
        'metaskirando.visits',
        JSON.stringify({ gulliver: { seen: ['gulliver:1'], baseline: null, at: Date.now() - 3600_000 } })
      );
      getAll.mockResolvedValue(answer([partnerOuting({ id: 'gulliver:2' }), partnerOuting({ id: 'gulliver:1' })]));
      const wrapper = mountView();
      await flushPromises();
      expect(wrapper.findAll('.row').map((r) => r.classes('new'))).toEqual([true, false]);
      await wrapper.find('[data-test="only-new"]').trigger('click');
      expect(wrapper.findAll('.row').map((r) => r.text())).toEqual(['gulliver:2']);
    });

    it('offers nothing at the first visit', async () => {
      const wrapper = mountView();
      await flushPromises();
      expect(wrapper.find('[data-test="only-new"]').exists()).toBe(false);
      expect(wrapper.findAll('.row.new')).toHaveLength(0);
    });
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
