import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import OutingsStatsPart from './OutingsStatsPart.vue';

const outings = [
  { date_start: '2020-02-01', activities: ['skitouring'], height_diff_up: 1200, ski_rating: '3.1' },
  { date_start: '2021-07-14', activities: ['rock_climbing'], height_diff_up: 300, rock_free_rating: '6a' },
];

const mountStats = async (activity: string | null = null) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/outings-stats', name: 'outings-stats', component: { render: () => h('div') } },
      { path: '/outings', name: 'outings', component: { render: () => h('div') } },
    ],
  });
  await router.push('/outings-stats?u=12');

  const wrapper = mount(OutingsStatsPart, {
    props: { outings, activity },
    attachTo: document.body,
    global: {
      plugins: [router],
      directives: { translate: {} },
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $dateUtils: { month: (month: number) => `m${month}` },
        } as never,
      },
    },
  });
  // the graphs are drawn once d3 is loaded
  await vi.waitFor(() => expect(wrapper.findAll('svg')).toHaveLength(10), { timeout: 10000 });
  return wrapper;
};

// the links of the graphs, decoded
const links = (wrapper: Awaited<ReturnType<typeof mountStats>>) =>
  wrapper
    .findAll('a')
    .map((link) => decodeURIComponent(link.attributes('xlink:href') ?? link.attributes('href') ?? ''));

describe('OutingsStatsPart', () => {
  // jsdom has no layout: the legends measure their text
  beforeAll(() => {
    Object.assign(SVGElement.prototype, { getBBox: () => ({ x: 0, y: 0, width: 50, height: 10 }) });
  });

  it('links the graphs to the outings list, keeping the filters of the page', async () => {
    const wrapper = await mountStats();

    expect(links(wrapper)).toEqual(
      expect.arrayContaining([
        '/outings?u=12&act=skitouring',
        '/outings?u=12&date=2020-01-01,2020-12-31',
        '/outings?u=12&date=2021-01-01,2021-12-31&act=rock_climbing',
      ])
    );
    wrapper.unmount();
  });

  it('keeps the activity of its tab in the links', async () => {
    const wrapper = await mountStats('skitouring');

    expect(
      links(wrapper)
        .filter(Boolean)
        .every((link) => link.includes('act=skitouring'))
    ).toBe(true);
    wrapper.unmount();
  });
});
