// Mounting the map in specs: jsdom, a router, the global properties of the app
import { mount } from '@vue/test-utils';
import type OlMapType from 'ol/Map';
import { vi } from 'vitest';
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
  mapLayers: { get(key: string): unknown }[];
  geolocation: unknown;
  highlightedFeature: unknown;
  visibleLayer: { get(key: string): unknown };
  setHighlightedFeature(feature: unknown): void;
  setDocumentGeometryFromGeoFile(file: string): void;
};

export const mountMap = async (props: Record<string, unknown> = {}) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:path*', name: 'waypoint', component: { render: () => null } }],
  });
  await router.push('/');
  const wrapper = mount(OlMap, {
    props,
    attachTo: document.body,
    global: {
      plugins: [router],
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $user: { isLogged: false },
          $language: { current: 'fr' },
          $documentUtils: { getDocumentTitle: () => '', hasSameGeolocation: () => false },
          $dateUtils: {},
        } as never,
      },
      stubs: { FaIcon: true, InputSlider: true, BiodivInformation: true, SwissProtectionAreaInformation: true },
      directives: { translate: {} },
    },
  });
  return { wrapper, vm: wrapper.vm as unknown as MapVm };
};
