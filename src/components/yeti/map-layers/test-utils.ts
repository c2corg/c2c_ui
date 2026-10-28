// Mounting a yeti map layer in specs: in a fake map, provided as YetiMap provides it
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';

import YetiMap from '@/components/yeti/YetiMap.vue';

// YetiMap is read through its options
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vm = any;

// what YetiMap provides, around a fake OpenLayers map
export const fakeMap = () => ({ addLayer: vi.fn(), addOverlay: vi.fn(), getView: () => 'view' });
export const provideFrom = (map: ReturnType<typeof fakeMap>) =>
  (YetiMap as Vm).provide.call({
    map,
    getExtent: (projection: string) => ['extent', projection],
    $gettext: (s: string) => s,
  });

export const mountInMap = (component: object, { stubs = {} } = {}) => {
  const map = fakeMap();
  const wrapper = mount(component, {
    global: {
      provide: provideFrom(map),
      stubs: { FaIcon: true, ...stubs },
      // read by the <script setup> layers: global properties, not mocks
      config: {
        globalProperties: {
          $gettext: (s: string) => s,
          // DataAvalancheLayer dates its avalanches from today
          $dateUtils: { toLocalizedString: (date: Date) => date.toISOString().slice(0, 10) },
        } as never,
      },
      directives: { translate: {} },
    },
  });
  return { wrapper, map };
};
