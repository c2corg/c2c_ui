// Mounting a yeti map layer in specs: in a fake map, provided as YetiMap provides it
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';

// what YetiMap provides, around a fake OpenLayers map
export const fakeMap = () => ({ addLayer: vi.fn(), addOverlay: vi.fn(), getView: () => 'view' });
// as YetiMap provides it
export const provideFrom = (map: ReturnType<typeof fakeMap>) => ({
  yetiMap: {
    map,
    getExtent: (projection: string) => ['extent', projection],
  },
});

export const mountInMap = (component: object, { stubs = {}, props = {} } = {}) => {
  const map = fakeMap();
  const wrapper = mount(component, {
    props,
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
