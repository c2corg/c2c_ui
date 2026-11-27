import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import AssociationQueryItem from './AssociationQueryItem.vue';
import QueryItems from './QueryItems.vue';
import QueryTags from './QueryTags.vue';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';

const waypoints = c2c.waypoint as DocumentService;
const routes = c2c.route as DocumentService;
const articles = c2c.article as DocumentService;

const mountItems = async (path: string) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/outings', name: 'outings', component: { render: () => h('div') } }],
  });
  await router.push(path);

  const wrapper = shallowMount(QueryItems, {
    global: {
      plugins: [router],
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $documentUtils: { getDocumentType: (type: string) => ({ w: 'waypoint', r: 'route', c: 'article' })[type] },
        } as never,
      },
    },
  });
  await flushPromises();
  return { wrapper, router };
};

describe('QueryItems', () => {
  afterEach(() => vi.restoreAllMocks());

  it('loads the documents of the association filters once for all the lists', async () => {
    const get = vi
      .spyOn(waypoints, 'get')
      .mockImplementation(
        (id) => Promise.resolve({ data: { document_id: id, type: 'w', title: 'Aiguille' } }) as never
      );

    const { wrapper } = await mountItems('/outings?w=501');
    const loaded = wrapper.emitted('documents-load')!.at(-1)![0] as { document_id: number; loading: boolean }[];
    expect(loaded).toMatchObject([{ document_id: 501, loading: false, title: 'Aiguille' }]);

    await mountItems('/outings?w=501');
    expect(get).toHaveBeenCalledOnce();
  });

  it('adds and removes association filters in the URL', async () => {
    vi.spyOn(waypoints, 'get').mockImplementation((id) => Promise.resolve({ data: { document_id: id } }) as never);
    const getRoute = vi
      .spyOn(routes, 'get')
      .mockImplementation((id) => Promise.resolve({ data: { document_id: id } }) as never);
    const { wrapper, router } = await mountItems('/outings?w=601');

    wrapper.findComponent(AssociationQueryItem).vm.$emit('add', { type: 'w', document_id: 602 });
    await flushPromises();
    expect(router.currentRoute.value.query.w).toBe('601,602');

    wrapper.findComponent(AssociationQueryItem).vm.$emit('add', { type: 'r', document_id: 7 });
    await flushPromises();
    expect(router.currentRoute.value.query.r).toBe('7');
    expect(getRoute).toHaveBeenCalledWith(7);
  });

  it('shows the article filter of the outings of an article', async () => {
    const get = vi
      .spyOn(articles, 'get')
      .mockImplementation(
        (id) => Promise.resolve({ data: { document_id: id, type: 'c', title: 'By fair means' } }) as never
      );

    const { wrapper } = await mountItems('/outings?c=1943275');
    const loaded = wrapper.emitted('documents-load')!.at(-1)![0] as { document_id: number; loading: boolean }[];
    expect(loaded).toMatchObject([{ document_id: 1943275, loading: false, title: 'By fair means' }]);
    expect(get).toHaveBeenCalledWith(1943275);
  });

  it('removes a filter whose document is still loading', async () => {
    vi.spyOn(articles, 'get').mockImplementation(() => new Promise(() => {}) as never);
    const { wrapper, router } = await mountItems('/outings?c=1943276');

    const [tag] = wrapper.findAllComponents(QueryTags)[0].props('documents') as { loading: boolean }[];
    expect(tag).toMatchObject({ document_id: 1943276, loading: true });
    wrapper.findAllComponents(QueryTags)[0].vm.$emit('remove', tag);
    await flushPromises();

    expect(router.currentRoute.value.query.c).toBeUndefined();
  });
});
