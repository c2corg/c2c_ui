import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { h, nextTick, reactive, ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import { type HeadTags, useHead, useNoRobots } from './head';
import { useModal } from './modal';
import { useQueryItem } from './query-item';
import { useUrlFilters } from './url-filters';
import { useViewMode, viewMode } from './view-mode';

import constants from '@/js/constants';

const headTag = (id: string) => document.getElementById(id);

describe('useHead', () => {
  const wrappers: { unmount(): void }[] = [];
  afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()));

  const mountWith = (setup: () => void) => {
    const wrapper = mount({ setup, render: () => h('div') });
    wrappers.push(wrapper);
    return wrapper;
  };

  it('adds the tags when mounted, follows what they depend on, and removes them when unmounted', async () => {
    const title = ref('Mont Blanc');
    const wrapper = mountWith(() =>
      useHead((): HeadTags => ({
        meta: [{ p: 'og:title', c: title.value, id: 'meta-og-title' }],
        link: [{ r: 'canonical', h: 'https://www.camptocamp.org/routes/12', id: 'canonical' }],
      }))
    );

    expect(headTag('meta-og-title')?.getAttribute('content')).toBe('Mont Blanc');
    expect(headTag('canonical')?.getAttribute('href')).toBe('https://www.camptocamp.org/routes/12');

    title.value = 'Aiguille Verte';
    await nextTick();
    expect(headTag('meta-og-title')?.getAttribute('content')).toBe('Aiguille Verte');

    wrapper.unmount();
    wrappers.pop();
    expect(headTag('meta-og-title')).toBeNull();
    expect(headTag('canonical')).toBeNull();
  });

  it('follows the changes in place of a reactive tag', async () => {
    const description = reactive({ p: 'og:description', c: 'Rocher', id: 'meta-og-description' });
    mountWith(() => useHead((): HeadTags => ({ meta: [description] })));

    description.c = 'Rocher et neige';
    await nextTick();

    expect(headTag('meta-og-description')?.getAttribute('content')).toBe('Rocher et neige');
  });

  it('keeps search engines out while mounted (useNoRobots)', () => {
    const wrapper = mountWith(() => useNoRobots());

    expect(headTag('meta-robots')?.getAttribute('content')).toBe('noindex');

    wrapper.unmount();
    wrappers.pop();
    expect(headTag('meta-robots')).toBeNull();
  });
});

describe('view mode', () => {
  it('tells the kind of view from the route name', () => {
    expect(viewMode('route')).toMatchObject({ isNormalView: true, isDraftView: false });
    expect(viewMode('route-version')).toMatchObject({ isVersionView: true, isNormalView: false });
    expect(viewMode('route-edit').isDraftView).toBe(true);
    expect(viewMode('outing-add').isDraftView).toBe(true);
    expect(viewMode('routes-print').isPrintingView).toBe(true);
  });

  it('follows the route (useViewMode)', async () => {
    const component = { render: () => h('div') };
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/routes/:id', name: 'route', component },
        { path: '/routes/edit/:id', name: 'route-edit', component },
      ],
    });
    await router.push('/routes/1');
    let mode: ReturnType<typeof useViewMode> | undefined;
    mount(
      { setup: () => void (mode = useViewMode()), render: () => h('div') },
      {
        global: { plugins: [router] },
      }
    );

    expect(mode?.isNormalView.value).toBe(true);
    await router.push('/routes/edit/1');
    expect(mode?.isDraftView.value).toBe(true);
    expect(mode?.isNormalView.value).toBe(false);
  });
});

// a router with a documents list and the itinevert pages, at the given URL
const routerAt = async (url: string) => {
  const component = { render: () => h('div') };
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/routes', name: 'routes', component },
      { path: '/waypoints', name: 'waypoints', component },
      { path: '/outings-stats', name: 'outings-stats', component },
      { path: '/itinevert', name: 'itinevert', component },
    ],
  });
  await router.push(url);
  return router;
};

// the values a composable gives, mounted with the router
const withRouter = async <T>(url: string, composable: () => T) => {
  const router = await routerAt(url);
  let result: T | undefined;
  mount({ setup: () => void (result = composable()), render: () => h('div') }, { global: { plugins: [router] } });
  return { router, result: result as T };
};

describe('useModal', () => {
  it('shows and hides, telling its parent', () => {
    const events: string[] = [];
    const modal = useModal((event) => events.push(event));

    modal.show();
    expect(modal.visible.value).toBe(true);
    modal.hide();
    expect(modal.visible.value).toBe(false);
    expect(events).toEqual(['show', 'hide']);
  });
});

describe('useUrlFilters', () => {
  it('reads the document type of the list, and its filters, from the route', async () => {
    expect((await withRouter('/routes?act=skitouring,hiking', useUrlFilters)).result.documentType.value).toBe('route');
    expect((await withRouter('/outings-stats', useUrlFilters)).result.documentType.value).toBe('outing');
    expect((await withRouter('/itinevert?documentType=waypoint', useUrlFilters)).result.documentType.value).toBe(
      'waypoint'
    );
    expect((await withRouter('/itinevert', useUrlFilters)).result.documentType.value).toBe('route');

    const { result } = await withRouter('/routes?act=skitouring,hiking', useUrlFilters);
    expect(result.urlActivities.value).toEqual(['skitouring', 'hiking']);
    expect(result.fields.value).toBe(constants.objectDefinitions.route.fields);
  });

  it('shows the fields of the activities, or of the waypoint types, in the URL', async () => {
    const routes = (await withRouter('/routes?act=skitouring', useUrlFilters)).result;
    expect(routes.fieldIsVisible(constants.objectDefinitions.route.fields.ski_rating)).toBe(true);
    expect(routes.fieldIsVisible(constants.objectDefinitions.route.fields.rock_free_rating)).toBe(false);

    const waypoints = (await withRouter('/waypoints?wtyp=climbing_outdoor', useUrlFilters)).result;
    const { fields } = constants.objectDefinitions.waypoint;
    expect(waypoints.fieldIsVisible(fields.climbing_outdoor_types)).toBe(true);
    expect(waypoints.fieldIsVisible(fields.capacity)).toBe(false);
  });
});

describe('useQueryItem', () => {
  const elevation = constants.objectDefinitions.route.fields.elevation_max; // url rmaxa, default 0,9000

  it('reads the value of a filter from the URL, and writes it back to the first page', async () => {
    const { router, result } = await withRouter('/routes?rmaxa=500,3000&offset=60', () =>
      useQueryItem(() => elevation)
    );
    expect(result.value.value).toEqual([500, 3000]);

    result.value.value = [1000, 4000];
    await flushRouter(router);
    expect(router.currentRoute.value.query).toEqual({ rmaxa: '1000,4000' });
  });

  it('leaves the default value out of the URL', async () => {
    const { router, result } = await withRouter('/routes?rmaxa=500,3000', () => useQueryItem(() => elevation));

    result.value.value = [0, 9000];
    await flushRouter(router);
    expect(router.currentRoute.value.query).toEqual({});
  });
});

const flushRouter = (router: { isReady(): Promise<void> }) =>
  router.isReady().then(() => new Promise((r) => setTimeout(r)));
