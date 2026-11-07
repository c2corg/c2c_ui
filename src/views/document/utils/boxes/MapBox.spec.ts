import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import MapBox from './MapBox.vue';

import utils from '@/js/utils';

describe('MapBox', () => {
  it('separates the areas with spaces', () => {
    const areas = ['France', 'Isère', 'Vercors'].map((name, i) => ({ document_id: i, name }));
    const wrapper = mount(MapBox, {
      props: { document: { type: 'r', document_id: 1, areas } },
      global: {
        plugins: [
          createRouter({
            history: createMemoryHistory(),
            routes: [{ path: '/:p(.*)*', component: { render: () => null } }],
          }),
        ],
        stubs: {
          DocumentLink: { props: ['document'], template: '<a>{{ document.name }}</a>' },
          IconArea: true,
          MapView: true,
          MapLinks: true,
          ElevationProfile: true,
          FaIcon: true,
        },
        config: {
          globalProperties: {
            $gettext: (value: string) => value,
            $documentUtils: { getDocumentType: () => 'route' },
            $screen: { isMobile: false },
          } as never,
        },
      },
    });

    expect(wrapper.find('.has-text-centered').text()).toBe('France Isère Vercors');
  });

  afterEach(() => vi.restoreAllMocks());

  it('downloads the track as GPX and KML, in WGS 84', async () => {
    const download = vi.spyOn(utils, 'download').mockImplementation(() => undefined);
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:p(.*)*', component: MapBox }] });
    await router.push('/routes/1/fr');
    const geom_detail = JSON.stringify({
      type: 'LineString',
      coordinates: [
        [730000, 5750000],
        [731000, 5751000],
      ],
    });
    const wrapper = mount(MapBox, {
      props: { document: { type: 'r', document_id: 1, areas: [], geometry: { geom_detail } } },
      global: {
        plugins: [router],
        stubs: {
          DocumentLink: true,
          IconArea: true,
          MapView: true,
          MapLinks: true,
          ElevationProfile: true,
          FaIcon: true,
        },
        config: {
          globalProperties: {
            $gettext: (value: string) => value,
            $documentUtils: { getDocumentType: () => 'route', getDocumentTitle: () => 'Voie normale' },
            $screen: { isMobile: false },
          } as never,
        },
      },
    });

    for (const format of ['GPX', 'KML']) {
      await wrapper
        .findAll('button')
        .find((button) => button.text() === format)!
        .trigger('click');
      await vi.waitFor(() => expect(download).toHaveBeenCalledTimes(format === 'GPX' ? 1 : 2));
    }
    await flushPromises();

    const [gpx, gpxName, gpxType] = download.mock.calls[0];
    expect([gpxName, gpxType]).toEqual(['1_Voie_normale.gpx', 'application/gpx+xml;charset=utf-8']);
    expect(gpx).toContain('<gpx');
    expect(gpx).toContain('<name>Voie normale</name>');
    expect(gpx).toMatch(/lat="45\.810\d*" lon="6\.557\d*"/);

    const [kml, kmlName] = download.mock.calls[1];
    expect(kmlName).toBe('1_Voie_normale.kml');
    expect(kml).toContain('<kml');
    expect(kml).toMatch(/6\.557\d*,45\.810\d*/);
  });
});
