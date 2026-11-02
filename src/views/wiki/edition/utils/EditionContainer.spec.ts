import { shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import EditionContainer from './EditionContainer.vue';

import c2c from '@/js/apis/c2c';
import MapView from '@/views/document/MapView.vue';

const mountEditionContainer = async (document = { type: 'w', locales: [{ lang: 'fr' }] }) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:lang/edit', name: 'edit', component: { render: () => h('div') } }],
  });
  await router.push('/fr/edit');

  return shallowMount(EditionContainer, {
    props: { document, mode: 'edit', isLoading: false },
    slots: { default: '<form class="edit-form" />' },
    global: {
      plugins: [router],
      directives: { translate: {} },
      config: {
        globalProperties: {
          $documentUtils: { getDocumentType: (type: string) => ({ w: 'waypoint', m: 'map' })[type] },
          $language: { current: 'fr', availableAPI: {} },
          $gettext: (msg: string) => msg,
        } as never,
      },
    },
  });
};

// let pending promises settle, and node report unhandled rejections
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('EditionContainer', () => {
  const onUnhandledRejection = vi.fn();
  let get: MockInstance;

  beforeEach(() => {
    onUnhandledRejection.mockClear();
    // stub the HTTP layer only, so that requests go through the real ApiData wrapper
    get = vi.spyOn(c2c.axios, 'get');
    process.on('unhandledRejection', onUnhandledRejection);
  });

  afterEach(() => {
    process.off('unhandledRejection', onUnhandledRejection);
    vi.restoreAllMocks();
  });

  it('shows the edit form without banners, and throws nothing, when banners request fails', async () => {
    get.mockRejectedValue(new Error('Request failed with status code 404'));

    const wrapper = await mountEditionContainer();
    await flush();

    expect(onUnhandledRejection).not.toHaveBeenCalled();
    expect(wrapper.find('.edit-form').exists()).toBe(true);
    expect(wrapper.find('.edition-banner').exists()).toBe(false);
  });

  it('requests banners again on next edit view after a failure, shows them at once, then caches them', async () => {
    get.mockResolvedValue({
      // as the API answers: the article, with its cooked locale (its schema requires the fields of an article)
      data: {
        document_id: 1110927,
        version: 1,
        type: 'c',
        quality: 'medium',
        protected: true,
        article_type: 'collab',
        locales: [{ lang: 'fr', version: 1, title: 'Bandeaux' }],
        cooked: {
          lang: 'fr',
          version: 1,
          title: 'Bandeaux',
          description: '<h3 id="waypoint">Waypoints</h3><p>Waypoint banner</p>',
        },
      },
    });

    const wrapper = await mountEditionContainer();
    await flush();

    expect(get).toHaveBeenCalledExactlyOnceWith('/articles/1110927?cook=fr', undefined);
    expect(wrapper.find('.edition-banner').text()).toBe('Waypoint banner');

    const nextWrapper = await mountEditionContainer();
    await flush();

    expect(get).toHaveBeenCalledOnce();
    expect(nextWrapper.find('.edition-banner').text()).toBe('Waypoint banner');
  });

  // the global map-view component is the map, not the view of a map document
  it('previews the document with its view', async () => {
    get.mockRejectedValue(new Error('no banners'));
    const draft = { type: 'm', locales: [{ lang: 'fr' }] };
    const wrapper = await mountEditionContainer(draft);

    await wrapper.find('button.is-pulled-right').trigger('click');

    expect(wrapper.findComponent(MapView).props('draft')).toEqual(draft);
    expect(wrapper.find('.edit-form').isVisible()).toBe(false);
  });
});
