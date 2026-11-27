// Mounting the map in specs: jsdom, a router, the global properties of the app
import { mount } from '@vue/test-utils';
import type OlMapType from 'ol/Map';
import { createPinia } from 'pinia';
import { vi } from 'vitest';
import type { Component } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import OlMap from './OlMap.vue';

// not implemented in jsdom, needed by ol.Map
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    disconnect() {}
  }
);

// what the specs reach of the map (Vue Test Utils gives the <script setup> bindings)
type MapVm = {
  map: OlMapType;
  setDocumentGeometryFromGeoFile(file: string): void;
};

// the map, or a component rendering it
export const mountMap = async (props: Record<string, unknown> = {}, component: Component = OlMap, path = '/') => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/routes/print', name: 'routes-print', component: { render: () => null } },
      { path: '/outings/:id', name: 'outing', component: { render: () => null } },
      { path: '/routes/:id', name: 'route', component: { render: () => null } },
      { path: '/:path*', name: 'waypoint', component: { render: () => null } },
    ],
  });
  await router.push(path);
  const wrapper = mount(component, {
    props,
    attachTo: document.body,
    global: {
      // the offline store, which says whether there is a network
      plugins: [router, createPinia()],
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $user: { isLogged: false },
          $language: { current: 'fr' },
          $documentUtils: {
            getDocumentTitle: () => '',
            hasSameGeolocation: () => false,
            getDocumentType: (type: string) =>
              (({ w: 'waypoint', r: 'route', o: 'outing' }) as Record<string, string | undefined>)[type],
          },
          $dateUtils: { toLocalizedString: (date: string) => date },
        } as never,
      },
      stubs: { FaIcon: true, InputSlider: true, BiodivInformation: true, SwissProtectionAreaInformation: true },
      directives: { translate: {} },
    },
  });
  return { wrapper, vm: wrapper.vm as unknown as MapVm };
};
