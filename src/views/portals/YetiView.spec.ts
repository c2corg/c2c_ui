import { flushPromises, shallowMount } from '@vue/test-utils';
import axios from 'axios';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';

import YetiView from './YetiView.vue';

import ValidationButton from '@/components/yeti/ValidationButton.vue';
import Yetix from '@/components/yeti/yetix';

// the map gives the extent sent to YETI
const YetiMapStub = defineComponent({
  name: 'YetiMap',
  setup(_, { expose }) {
    expose({ getExtent: () => [650000, 5750000, 652000, 5752000] });
    return () => null;
  },
});

const mountView = () =>
  shallowMount(YetiView, {
    global: {
      config: { globalProperties: { $gettext: (text: string) => text } as never },
      mocks: { $route: { query: {}, params: {}, fullPath: '/yeti' } },
      directives: { translate: {} },
      // the panels hold the validation buttons
      stubs: { YetiMap: YetiMapStub, Panel: { template: '<div><slot /></div>' } },
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

describe('YetiView compute', () => {
  afterEach(() => vi.restoreAllMocks());

  const mountReadyView = async () => {
    const wrapper = mountView();
    Yetix.setMapZoom(14);
    Yetix.setBra('high', 2);
    Yetix.setMethod('type', 'mrd');
    await nextTick();
    return wrapper;
  };

  it('sends the danger and the method of the form to YETI', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: 'image' });
    const wrapper = await mountReadyView();

    wrapper.findComponent(ValidationButton).vm.$emit('click');
    await flushPromises();

    const url = get.mock.calls[0][0];
    expect(url).toContain('methode=mrd;');
    expect(url).toContain('risque_haut=2;risque_bas=2;seuil_alti=0');
    expect(Yetix.yetiData).toBe('image');
  });

  it('tells the service is inactive when it does not answer', async () => {
    // a network error has no response
    vi.spyOn(axios, 'get').mockRejectedValue(new Error('Network Error'));
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const wrapper = await mountReadyView();

    wrapper.findComponent(ValidationButton).vm.$emit('click');
    await flushPromises();

    expect(alert).toHaveBeenCalledWith('YETI Service: Service is inactive right now');
  });

  it('shows the error text of a rejected request', async () => {
    vi.spyOn(axios, 'get').mockRejectedValue({
      response: {
        status: 400,
        data: '<ExceptionReport><Exception><ExceptionText>Bad bbox</ExceptionText></Exception></ExceptionReport>',
      },
    });
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const wrapper = await mountReadyView();

    wrapper.findComponent(ValidationButton).vm.$emit('click');
    await flushPromises();

    expect(alert).toHaveBeenCalledWith('YETI Service: Bad bbox');
  });
});
