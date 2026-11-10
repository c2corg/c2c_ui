// Each document view renders its document: every binding its template reads is given by its <script setup>
import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import AreaView from './AreaView.vue';
import ArticleView from './ArticleView.vue';
import BookView from './BookView.vue';
import ImageView from './ImageView.vue';
import MapView from './MapView.vue';
import OutingView from './OutingView.vue';
import ProfileView from './ProfileView.vue';
import RouteView from './RouteView.vue';
import WaypointView from './WaypointView.vue';
import XreportView from './XreportView.vue';

import { ApiData } from '@/js/apis/BaseApi';

const api = vi.hoisted(() => ({ getCooked: vi.fn() }));

// one document service per type, as the API has
vi.mock('@/js/apis/c2c', () => ({ default: new Proxy({}, { get: () => ({ getCooked: api.getCooked }) }) }));

const response = (data: unknown) => new ApiData(Promise.resolve({ data } as never));

const documentOf = (type: string) => ({
  document_id: 12,
  type,
  version: 1,
  protected: false,
  quality: 'fine',
  activities: ['mountain_climbing'],
  waypoint_type: 'hut',
  cooked: { lang: 'fr', title: 'Mont Blanc', summary: 'summary', description: 'description' },
  locales: [{ lang: 'fr', title: 'Mont Blanc' }],
  associations: {
    waypoints: [],
    routes: [],
    users: [],
    images: [],
    articles: [],
    books: [],
    outings: [],
    xreports: [],
  },
  areas: [],
  available_langs: ['fr'],
  geometry: null,
});

const Empty = { render: () => null };

// the global components of the app (generic-components.ts, font-awesome-config.ts), as empty components: the views
// may use them without importing them
const globalComponents = Object.fromEntries(
  [
    ...Object.keys(import.meta.glob('@/components/generics/**/*.vue')).map((path) =>
      path
        .split('/')
        .slice(-1)[0]
        .replace('.vue', '')
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .substring(1)
    ),
    'document-card',
    'map-view',
    'fa-icon',
    'fa-layers',
  ].map((name) => [name, Empty])
);

afterEach(() => {
  vi.clearAllMocks();
  document.head.innerHTML = '';
});

describe('document views', () => {
  it.each([
    ['area', AreaView],
    ['article', ArticleView],
    ['book', BookView],
    ['image', ImageView],
    ['map', MapView],
    ['outing', OutingView],
    ['profile', ProfileView],
    ['route', RouteView],
    ['waypoint', WaypointView],
    ['xreport', XreportView],
  ])('%s view renders its document', async (type, view) => {
    api.getCooked.mockImplementation(() => response(documentOf(type)));
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: `/${type}s/:id(\\d+)/:lang?/:title?`, name: type, component: Empty }],
    });
    await router.push(`/${type}s/12/fr`);
    const errors = vi.spyOn(console, 'warn');

    const wrapper = shallowMount(view as Component, {
      global: {
        plugins: [router],
        components: globalComponents,
        renderStubDefaultSlot: true,
        config: {
          globalProperties: {
            $gettext: (s: string) => s,
            $screen: { isMobile: false },
            $filters: { uppercaseFirstLetter: (s: string) => s },
            $language: { current: 'fr', getIsoLanguageTerritory: (lang: string) => lang },
            $user: { isLogged: false, isModerator: false },
            $imageViewer: { clear: vi.fn() },
            $documentUtils: {
              getDocumentTitle: () => 'Mont Blanc',
              getLocaleSmart: (doc: { cooked: object }) => doc.cooked,
              hasRating: () => false,
            },
          } as never,
        },
        directives: { translate: {} },
      },
    });
    await flushPromises();

    expect(api.getCooked).toHaveBeenCalledWith(12, 'fr');
    expect(wrapper.html()).not.toBe('');
    // a binding the template reads missing from the setup, or a child component not imported
    const missing = errors.mock.calls.filter(([message]) =>
      /was accessed during render|Failed to resolve component/.test(String(message))
    );
    expect(missing).toEqual([]);
  });
});
