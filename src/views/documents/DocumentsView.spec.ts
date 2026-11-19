import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import DocumentsView from './DocumentsView.vue';
import DisplayModeSwitch from './utils/DisplayModeSwitch.vue';
import PageNavigation from './utils/PageNavigation.vue';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { getPreferences } from '@/js/vue-plugins/local-storage';

const mountView = async (
  url = '/routes',
  total = 0,
  documents: object[] = [],
  $screen = { isMobile: false, isTablet: false }
) => {
  // what the API service returns: the response once loaded, and then(), which gives the object back, to be told when
  const apiData = {
    data: { documents, total },
    then(callback: (loaded: { data: { total: number } }) => void) {
      callback(apiData);
      return apiData;
    },
  };
  const getAll = vi.spyOn(c2c.route as DocumentService, 'getAll').mockReturnValue(apiData as never);
  vi.spyOn(c2c.waypoint as DocumentService, 'getAll').mockReturnValue(apiData as never);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/routes', name: 'routes', component: { render: () => null } },
      { path: '/waypoints', name: 'waypoints', component: { render: () => null } },
    ],
  });
  await router.push(url);
  const wrapper = shallowMount(DocumentsView, {
    global: {
      plugins: [router],
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $filters: { uppercaseFirstLetter: (text: string) => text },
          $screen,
        } as never,
      },
      directives: { translate: {} },
      // the map, resized when its container changes
      stubs: { MapView: { render: () => null, methods: { resize: mapResize } } },
    },
  });
  await flushPromises();
  return { wrapper, router, getAll };
};

const mapResize = vi.fn();

describe('DocumentsView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // the list mode is remembered
    window.localStorage.clear();
    getPreferences('DocumentsView').reload();
  });

  // the display mode menu shows the icon of the cards, or of the list
  it('tells the display mode menu whether the results are a list', async () => {
    const { wrapper } = await mountView();
    const displayModeSwitch = wrapper.findComponent(DisplayModeSwitch);

    expect(displayModeSwitch.props('listMode')).toBe(false);

    await wrapper.find('.header-right > span.has-cursor-pointer').trigger('click');
    expect(displayModeSwitch.props('listMode')).toBe(true);
  });

  it('shows the pagination below the results, when there are several pages', async () => {
    const { wrapper } = await mountView('/routes', 100);

    expect(wrapper.findComponent(PageNavigation).props('documents')).toMatchObject({ total: 100 });
  });

  it('goes to the page an offset in the middle of a page belongs to, before loading it', async () => {
    const { router, getAll } = await mountView('/routes?offset=45', 100);

    expect(router.currentRoute.value.query).toEqual({ offset: '30', limit: '30' });
    expect(getAll).toHaveBeenCalledTimes(1);
    expect(getAll).toHaveBeenCalledWith({ offset: '30', limit: '30' });
  });

  it('goes to the last page when the offset is past the results', async () => {
    const { router } = await mountView('/routes?offset=240&limit=30', 45);

    expect(router.currentRoute.value.query).toEqual({ offset: '30', limit: '30' });
  });

  it('switches between the map and the results with a button on mobile', async () => {
    const { wrapper } = await mountView('/routes', 0, [], { isMobile: true, isTablet: false });
    const toggle = () => wrapper.find('button[title="Show the map"], button[title="Show the results"]');

    expect(toggle().attributes('title')).toBe('Show the map');
    await toggle().trigger('click');
    expect(wrapper.find('.result-section').classes()).toContain('mobile-mode-map');
    expect(toggle().attributes('title')).toBe('Show the results');
  });

  describe('splitter between the results and the map', () => {
    const stored = () => JSON.parse(window.localStorage.getItem('DocumentsView.preferences') ?? '{}');
    const store = (data: object) => {
      window.localStorage.setItem('DocumentsView.preferences', JSON.stringify(data));
      getPreferences('DocumentsView').reload();
    };

    it('is only on desktop', async () => {
      expect((await mountView()).wrapper.find('[role="separator"]').exists()).toBe(true);
      expect(
        (await mountView('/routes', 0, [], { isMobile: false, isTablet: true })).wrapper
          .find('[role="separator"]')
          .exists()
      ).toBe(false);
    });

    it('keeps the widths of the Bulma classes until a width is chosen', async () => {
      const { wrapper } = await mountView();

      expect(wrapper.find('.documents-container').classes()).toContain('is-8');
      expect(wrapper.find('.documents-container').classes()).not.toContain('has-custom-width');
    });

    it('gives the results the stored width of the cards or of the list, within the limits', async () => {
      store({ resultsGridWidth: 40, resultsListWidth: 95 });
      const { wrapper } = await mountView();
      const container = () => wrapper.find<HTMLElement>('.documents-container');

      expect(container().classes()).toContain('has-custom-width');
      expect(container().element.style.getPropertyValue('--results-width')).toBe('40%');
      expect(wrapper.find('[role="separator"]').attributes('aria-valuenow')).toBe('40');

      await wrapper.find('.header-right > span.has-cursor-pointer').trigger('click');
      expect(container().element.style.getPropertyValue('--results-width')).toBe('75%');
    });

    it('changes the width with the arrow keys, and stores it', async () => {
      store({ resultsGridWidth: 50 });
      const { wrapper } = await mountView();
      const separator = wrapper.find('[role="separator"]');

      await separator.trigger('keydown', { key: 'ArrowRight' });
      await separator.trigger('keydown', { key: 'ArrowRight' });
      await separator.trigger('keydown', { key: 'ArrowLeft' });

      expect(separator.attributes('aria-valuenow')).toBe('52');
      expect(stored()).toEqual({ resultsGridWidth: 52 });
    });

    it('follows the pointer when dragged, and stores the width when dropped', async () => {
      const { wrapper } = await mountView();
      const rect = (left: number, right: number) => ({ left, right, width: right - left }) as DOMRect;
      vi.spyOn(wrapper.find('.result-section').element, 'getBoundingClientRect').mockReturnValue(rect(0, 1000));
      vi.spyOn(wrapper.find('.documents-container').element, 'getBoundingClientRect').mockReturnValue(rect(0, 600));
      const separator = wrapper.find('[role="separator"]');
      const pointer = async (type: string, clientX = 0) => {
        separator.element.dispatchEvent(new MouseEvent(type, { button: 0, clientX }));
        await flushPromises();
      };

      // grabbed 4px right of the edge of the results
      await pointer('pointerdown', 604);
      await pointer('pointermove', 304);
      expect(wrapper.find('.result-section').classes()).toContain('is-resizing');
      expect(wrapper.find<HTMLElement>('.documents-container').element.style.getPropertyValue('--results-width')).toBe(
        '30%'
      );
      await vi.waitFor(() => expect(mapResize).toHaveBeenCalled());
      await pointer('pointermove', 100);
      await pointer('pointerup');

      expect(wrapper.find('.result-section').classes()).not.toContain('is-resizing');
      expect(stored()).toEqual({ resultsGridWidth: 25 });
    });

    it('goes back to the default width on double click', async () => {
      store({ resultsGridWidth: 40, resultsListWidth: 60 });
      const { wrapper } = await mountView();

      await wrapper.find('[role="separator"]').trigger('dblclick');

      expect(wrapper.find('.documents-container').classes()).not.toContain('has-custom-width');
      expect(stored()).toEqual({ resultsListWidth: 60 });
    });

    it('shows one card per row when the results are narrow', async () => {
      store({ resultsGridWidth: 30 });
      const observers: ResizeObserverCallback[] = [];
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(callback: ResizeObserverCallback) {
            observers.push(callback);
          }
          observe() {}
          disconnect() {}
        }
      );
      const { wrapper } = await mountView('/routes', 2, [{ document_id: 1 }, { document_id: 2 }]);
      vi.spyOn(wrapper.find('.result-section').element, 'clientWidth', 'get').mockReturnValue(1500);
      vi.spyOn(wrapper.find<HTMLElement>('.documents-container').element, 'offsetWidth', 'get').mockReturnValue(450);
      observers.forEach((callback) => callback([], {} as ResizeObserver));
      await flushPromises();

      expect(wrapper.find('.card-container').classes()).toContain('is-full');
      expect(wrapper.find('.card-container').classes()).not.toContain('is-half-desktop');
      vi.unstubAllGlobals();
    });
  });
});
