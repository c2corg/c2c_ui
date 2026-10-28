import { shallowMount } from '@vue/test-utils';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import YetiView from './YetiView.vue';

import Yetix from '@/components/yeti/Yetix.vue';

const mountView = () =>
  shallowMount(YetiView, {
    global: {
      mocks: { $gettext: (text: string) => text, $route: { query: {}, params: {} } },
      directives: { translate: {} },
    },
  });

describe('YetiView tabs', () => {
  it('shows the tabs once loaded', () => {
    mountView();

    expect((Yetix.tabs as { id: string }[]).map((tab) => tab.id)).toEqual(['layer', 'risk', 'route', 'meteo']);
  });

  it('counts the drawn route on its tab', async () => {
    mountView();

    Yetix.setFeatures([
      new Feature(
        new LineString([
          [0, 0],
          [1, 1],
        ])
      ),
    ]);
    await nextTick();

    const routeTab = (Yetix.tabs as { id: string; counter?: { text: unknown } }[]).find((tab) => tab.id === 'route');
    expect(routeTab?.counter?.text).toBe(1);
  });
});
