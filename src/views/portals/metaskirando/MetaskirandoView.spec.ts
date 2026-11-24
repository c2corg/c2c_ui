import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import MetaskirandoView from './MetaskirandoView.vue';
import { c2cOuting, partnerOuting, sources } from './fixtures';

import { usePartnerOutingsStore } from '@/stores/partner-outings';

const getAll = vi.hoisted(() => vi.fn());
vi.mock('@/js/apis/partner-outings-service', () => ({ default: { getAll } }));
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

const mountView = () =>
  shallowMount(MetaskirandoView, {
    global: {
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $language: { current: 'fr' },
          $dateUtils: { toLocalizedString: (date: string) => `day ${date}`, timeAgo: () => '3 hours ago' },
          $filters: { uppercaseFirstLetter: (text: string) => text },
        } as never,
      },
      stubs: { PartnerOutingRow: { props: ['outing'], template: '<div class="row">{{ outing.id }}</div>' } },
    },
  });

beforeEach(() => {
  getAll.mockReset();
  getAll.mockResolvedValue(answer());
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
    expect(lines).toEqual(['Gulliver: Last updated 3 hours ago', 'Skitour: Source unavailable']);
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
    expect(lines).toEqual(['Gulliver: Last updated 3 hours ago', 'Skitour: Source unavailable']);
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
});
