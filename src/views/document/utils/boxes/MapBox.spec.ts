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

  describe('pinned map in the url', () => {
    const mountAt = async (path: string, width: number) => {
      vi.stubGlobal('innerWidth', width);
      vi.stubGlobal('innerHeight', 900);
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/:p(.*)*', component: MapBox }],
      });
      await router.push(path);
      const wrapper = mount(MapBox, {
        props: { document: { type: 'r', document_id: 1, areas: [] } },
        global: {
          plugins: [router],
          stubs: {
            DocumentLink: true,
            IconArea: true,
            MapView: { template: '<div />', methods: { fitMapToDocuments() {} } },
            MapLinks: true,
            ElevationProfile: true,
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
      await flushPromises();
      return { router, wrapper };
    };

    afterEach(() => {
      vi.unstubAllGlobals();
      document.body.style.paddingTop = '';
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = '';
    });

    const clickPin = async (wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper']) => {
      wrapper.findComponent({ ref: 'olMap' }).vm.$emit('pin-to-top-clicked');
      await flushPromises();
    };

    it('fills the window after the two sides, then unpins', async () => {
      const { wrapper, router } = await mountAt('/routes/1/fr', 1400);
      const pins = [];
      for (let i = 0; i < 4; i++) {
        await clickPin(wrapper);
        pins.push(router.currentRoute.value.query.pin);
        if (i === 2) {
          expect(wrapper.find('#fullscreen-map-container').classes()).toContain('full-window');
          expect(wrapper.find('.map-container').classes()).not.toContain('pinned');
          expect(document.documentElement.style.overflow).toBe('hidden');
        }
      }

      expect(pins).toEqual(['right', 'top', 'window', undefined]);
      expect(document.documentElement.style.overflow).toBe('');
      wrapper.unmount();
    });

    it('fills the window after the top on a phone', async () => {
      const { wrapper, router } = await mountAt('/routes/1/fr', 600);
      await clickPin(wrapper);
      await clickPin(wrapper);

      expect(router.currentRoute.value.query.pin).toBe('window');
      wrapper.unmount();
    });

    it('leaves the full window with Esc, and unlocks the page when it leaves', async () => {
      const { wrapper, router } = await mountAt('/routes/1/fr?pin=window', 1400);
      expect(wrapper.find('#fullscreen-map-container').classes()).toContain('full-window');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await flushPromises();
      expect(wrapper.find('#fullscreen-map-container').classes()).not.toContain('full-window');
      expect(router.currentRoute.value.query.pin).toBeUndefined();

      await clickPin(wrapper);
      await clickPin(wrapper);
      await clickPin(wrapper);
      expect(document.documentElement.style.overflow).toBe('hidden');
      wrapper.unmount();
      expect(document.documentElement.style.overflow).toBe('');
    });

    it('pins the map on the side of the url', async () => {
      const { wrapper } = await mountAt('/routes/1/fr?pin=right', 1400);

      expect(wrapper.find('.map-container').classes()).toContain('pinned-to-right');
      wrapper.unmount();
    });

    it('pins on the first side when the one of the url does not exist on a phone', async () => {
      const { wrapper, router } = await mountAt('/routes/1/fr?pin=right', 600);

      expect(wrapper.find('.map-container').classes()).toContain('pinned-to-top');
      expect(router.currentRoute.value.query.pin).toBe('top');
      wrapper.unmount();
    });

    it('keeps the hash when the user pins the map', async () => {
      const { wrapper, router } = await mountAt('/routes/1/fr#description', 1400);
      wrapper.findComponent({ ref: 'olMap' }).vm.$emit('pin-to-top-clicked');
      await flushPromises();

      expect(router.currentRoute.value.query.pin).toBe('right');
      expect(router.currentRoute.value.hash).toBe('#description');
      wrapper.unmount();
    });

    it('does not write the url when it unpins the map on leaving the page', async () => {
      const { wrapper, router } = await mountAt('/routes/1/fr?pin=top&overlays=outing', 600);
      const replace = vi.spyOn(router, 'replace');
      wrapper.unmount();
      await flushPromises();

      expect(replace).not.toHaveBeenCalled();
    });
  });
});
