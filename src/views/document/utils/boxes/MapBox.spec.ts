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

  describe('pinned map', () => {
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
      window.localStorage.removeItem('DocumentMap.preferences');
    });
    const storedPin = () => JSON.parse(window.localStorage.getItem('DocumentMap.preferences') ?? '{}').settings?.pin;

    const clickPin = async (wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper']) => {
      wrapper.findComponent({ ref: 'olMap' }).vm.$emit('pin-to-top-clicked');
      await flushPromises();
    };

    it('fills the window after the two sides, then unpins', async () => {
      const { wrapper, router } = await mountAt('/routes/1/fr', 1400);
      const pins = [];
      for (let i = 0; i < 4; i++) {
        await clickPin(wrapper);
        pins.push(
          wrapper
            .find('.map-container')
            .classes()
            .find((name) => name.startsWith('pinned-to-')) ?? ''
        );
        if (i === 2) {
          expect(wrapper.find('#fullscreen-map-container').classes()).toContain('full-window');
          expect(wrapper.find('.map-container').classes()).not.toContain('pinned');
          expect(document.documentElement.style.overflow).toBe('hidden');
        }
      }

      // the whole window is no side
      expect(pins).toEqual(['pinned-to-right', 'pinned-to-top', '', '']);
      expect(router.currentRoute.value.query).toEqual({});
      expect(document.documentElement.style.overflow).toBe('');
      wrapper.unmount();
    });

    it('fills the window after the top on a phone', async () => {
      const { wrapper } = await mountAt('/routes/1/fr', 600);
      await clickPin(wrapper);
      await clickPin(wrapper);

      expect(wrapper.find('#fullscreen-map-container').classes()).toContain('full-window');
      wrapper.unmount();
    });

    it('leaves the full window with Esc, and unlocks the page when it leaves', async () => {
      const { wrapper } = await mountAt('/routes/1/fr?pin=window', 1400);
      expect(wrapper.find('#fullscreen-map-container').classes()).toContain('full-window');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await flushPromises();
      expect(wrapper.find('#fullscreen-map-container').classes()).not.toContain('full-window');

      await clickPin(wrapper);
      await clickPin(wrapper);
      await clickPin(wrapper);
      expect(document.documentElement.style.overflow).toBe('hidden');
      wrapper.unmount();
      expect(document.documentElement.style.overflow).toBe('');
    });

    it('pins the map on the side of a shared link', async () => {
      const { wrapper } = await mountAt('/routes/1/fr?pin=right', 1400);

      expect(wrapper.find('.map-container').classes()).toContain('pinned-to-right');
      wrapper.unmount();
    });

    it('pins on the first side when the one of the link does not exist on a phone', async () => {
      const { wrapper } = await mountAt('/routes/1/fr?pin=right', 600);

      expect(wrapper.find('.map-container').classes()).toContain('pinned-to-top');
      wrapper.unmount();
    });

    it('keeps the side the user pins the map on, for the next pages, but not the whole window', async () => {
      const { wrapper } = await mountAt('/routes/1/fr', 1400);
      await clickPin(wrapper);
      expect(storedPin()).toBe('right');
      await clickPin(wrapper);
      expect(storedPin()).toBe('top');
      await clickPin(wrapper);
      expect(storedPin()).toBe('top');
      await clickPin(wrapper);
      expect(storedPin()).toBeUndefined();
      wrapper.unmount();
    });

    it('pins the map on the stored side, the first one on a phone, and gives the side to the map', async () => {
      window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { pin: 'right' } }));
      const desktop = await mountAt('/routes/1/fr', 1400);
      expect(desktop.wrapper.find('.map-container').classes()).toContain('pinned-to-right');
      expect(desktop.wrapper.findComponent({ ref: 'olMap' }).attributes('pinned-side')).toBe('right');
      desktop.wrapper.unmount();

      const phone = await mountAt('/routes/1/fr', 600);
      expect(phone.wrapper.find('.map-container').classes()).toContain('pinned-to-top');
      phone.wrapper.unmount();
    });

    it('pins the map on the side of the link, over the stored one, without storing it', async () => {
      window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { pin: 'right' } }));
      const { wrapper } = await mountAt('/routes/1/fr?pin=top', 1400);
      expect(wrapper.find('.map-container').classes()).toContain('pinned-to-top');
      expect(storedPin()).toBe('right');
      wrapper.unmount();
    });

    it('unpins for the next pages when Esc leaves the whole window', async () => {
      window.localStorage.setItem('DocumentMap.preferences', JSON.stringify({ settings: { pin: 'right' } }));
      const { wrapper } = await mountAt('/routes/1/fr?pin=window', 1400);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await flushPromises();
      expect(storedPin()).toBeUndefined();
      wrapper.unmount();
    });

    it('leaves the url to the map, when the user pins the map or when it is unpinned on leaving the page', async () => {
      const { wrapper, router } = await mountAt('/routes/1/fr#description', 1400);
      const replace = vi.spyOn(router, 'replace');
      await clickPin(wrapper);
      wrapper.unmount();
      await flushPromises();

      expect(replace).not.toHaveBeenCalled();
    });
  });

  describe('the position of the device on the map', () => {
    const shown = (coarse: boolean, width: number, height: number) => {
      vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(pointer: coarse)' && coarse }));
      vi.stubGlobal('innerWidth', width);
      vi.stubGlobal('innerHeight', height);
      const wrapper = mount(MapBox, {
        props: { document: { type: 'r', document_id: 1, areas: [] } },
        global: {
          plugins: [
            createRouter({
              history: createMemoryHistory(),
              routes: [{ path: '/:p(.*)*', component: { render: () => null } }],
            }),
          ],
          stubs: {
            MapView: {
              name: 'MapView',
              props: { showCenterOnGeolocation: Boolean, followPosition: Boolean },
              template: '<div class="map" />',
            },
            DocumentLink: true,
            IconArea: true,
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
      const map = wrapper.findComponent({ name: 'MapView' });
      const props = { button: map.props('showCenterOnGeolocation'), follow: map.props('followPosition') };
      wrapper.unmount();
      vi.unstubAllGlobals();
      return props;
    };

    it('is followed on phones, either way up', () => {
      expect(shown(true, 390, 844)).toEqual({ button: true, follow: true });
      expect(shown(true, 844, 390)).toEqual({ button: true, follow: true });
    });

    it('is not offered on tablets nor on computers, even in a short window', () => {
      expect(shown(true, 820, 1180).button).toBe(false);
      expect(shown(false, 1366, 650).button).toBe(false);
    });
  });
});
