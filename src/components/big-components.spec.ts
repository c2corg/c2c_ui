// the bigger components moved to <script setup lang="ts">: what their scripts do
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import AssociationItems from './association-editor/AssociationItems.vue';
import DocumentsTable from './datatable/DocumentsTable.vue';
import FeedWidget from './feed-widget/FeedWidget.vue';
import HelperWindow from './helper/HelperWindow.vue';

import { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import type { Helper } from '@/js/vue-plugins/helper-window';
import helperWindow from '@/js/vue-plugins/helper-window';

const apiData = (data: unknown) => new ApiData(Promise.resolve({ data } as never));

const ModalCard = defineComponent({
  name: 'ModalCard',
  setup(_, { expose, slots }) {
    expose({ show() {}, hide() {} });
    return () => h('div', [slots.title?.(), slots.default?.(), slots.footer?.()]);
  },
});

const globalProperties = {
  $gettext: (text: string) => text,
  $filters: { uppercaseFirstLetter: (text: string) => text },
  $language: { current: 'fr' },
  $user: { isLogged: false, isModerator: false, id: 1 },
  $documentUtils: {
    getDocumentTitle: (document: { title: string }) => document.title,
    getSortedAreaList: () => '',
  },
  $dateUtils: { toLocalizedString: (value: string) => value },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FeedWidget', () => {
  const item = (id: number, document: Record<string, unknown>) => ({
    id,
    time: '',
    change_type: 'created',
    user: {},
    participants: [],
    image1: null,
    document: { locales: [{}], ...document },
  });

  it('puts each card in the shortest column, the figures of its document making it longer', async () => {
    // two columns
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
    vi.spyOn(c2c.feed, 'getDefaultFeed')
      // the infinite scroll asks for the next page at once: there is none
      .mockReturnValue(apiData({ feed: [] }))
      .mockReturnValueOnce(apiData({ feed: [item(1, {}), item(2, { elevation_max: 4000 }), item(3, {})] }));
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { render: () => null } }],
    });
    await router.push('/');

    const wrapper = mount(FeedWidget, {
      props: { type: 'default' },
      global: {
        plugins: [router],
        config: { globalProperties: globalProperties as never },
        stubs: {
          FeedCard: defineComponent({ props: ['item'], setup: (props) => () => h('i', String(props.item.id)) }),
        },
      },
    });
    await flushPromises();

    // 1 in the first column, 2 (with figures, longer) in the second: 3 goes to the first, now the shortest
    expect(wrapper.findAll('.column').map((column) => column.text())).toEqual(['13', '2']);
  });
});

describe('HelperWindow', () => {
  it('registers as $helper, and shows the section of the article', async () => {
    vi.spyOn(c2c.article as DocumentService, 'getCooked').mockReturnValue(
      apiData({
        protected: true,
        cooked: {
          title: 'Ratings',
          description: '<h2 id="ski">Ski</h2><p>Ski ratings</p><h2 id="rock">Rock</h2><p>Rock ratings</p>',
        },
      })
    );
    const wrapper = mount(HelperWindow, {
      global: {
        plugins: [helperWindow],
        config: { globalProperties: globalProperties as never },
        components: { ModalCard },
        directives: { translate: {} },
      },
    });

    const helper = (wrapper.vm as unknown as { $helper: Helper }).$helper;
    helper.show('123#rock');
    await flushPromises();

    expect((c2c.article as DocumentService).getCooked).toHaveBeenCalledWith(123, 'fr');
    expect(wrapper.text()).toContain('Rock');
    expect(wrapper.find('.content').html()).toContain('Rock ratings');
    expect(wrapper.find('.content').html()).not.toContain('Ski ratings');
  });
});

describe('AssociationItems', () => {
  it('associates a proposition, and puts back a removed document', async () => {
    vi.spyOn(c2c.association, 'create').mockReturnValue(apiData({}) as never);
    vi.spyOn(c2c.association, 'remove').mockReturnValue(apiData({}) as never);
    const current = [{ document_id: 2, type: 'w', title: 'Refuge' }];
    const wrapper = mount(AssociationItems, {
      props: {
        parent: { document_id: 1, type: 'r', title: 'Route' },
        arrayName: 'waypoints',
        childType: 'waypoint',
        current,
        propositions: { total: 1, documents: [{ document_id: 3, type: 'w', title: 'Summit' }] },
      },
      global: { config: { globalProperties: globalProperties as never }, stubs: { PrettyWaypointLink: true } },
    });
    const buttons = () => wrapper.findAll('button').map((button) => button.text());
    expect(buttons()).toEqual(['Remove', 'Add']);

    await wrapper.findAll('button')[1].trigger('click');
    await flushPromises();
    expect(c2c.association.create).toHaveBeenCalledWith(
      { document_id: 1, type: 'r', title: 'Route' },
      { document_id: 3, type: 'w', title: 'Summit' }
    );
    expect(current.map((document) => document.document_id)).toEqual([2, 3]);

    await wrapper.findAll('button')[0].trigger('click');
    await flushPromises();
    expect(current.map((document) => document.document_id)).toEqual([3]);
    expect(buttons()).toEqual(['Put it back', 'Remove']);
  });
});

describe('DocumentsTable', () => {
  it('exports the ratings of a route as they are shown', () => {
    const wrapper = mount(DocumentsTable, {
      props: { documentType: 'route', documents: { documents: [] } },
      global: { config: { globalProperties: globalProperties as never }, stubs: { AgGridVue: true } },
    });
    const { formatRating } = wrapper.vm as unknown as { formatRating(document: object): string };

    expect(
      formatRating({ global_rating: 'D', rock_free_rating: '6a', rock_required_rating: '5c', engagement_rating: 'III' })
    ).toBe('D 6a>5c III');
    expect(formatRating({ ski_rating: '4.2', labande_global_rating: 'AD', labande_ski_rating: 'S4' })).toBe(
      '4.2 / AD / S4'
    );
  });
});
