import { createLocalVue, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ImageEditionView from './ImageEditionView';
import OutingEditionView from './OutingEditionView';
import ProfileEditionView from './ProfileEditionView';
import RouteEditionView from './RouteEditionView';
import WaypointEditionView from './WaypointEditionView';
import XreportEditionView from './XreportEditionView';

import constants from '@/js/constants';

// Vue reports errors thrown in watchers and in $nextTick callbacks to this handler instead of throwing them
let errors;
const localVue = createLocalVue();
localVue.config.errorHandler = (error) => errors.push(error);
// async $nextTick callbacks reject instead
const onRejection = (error) => errors.push(error);

const POINT = '{"type":"Point","coordinates":[700000,5700000]}';

const newDocument = (properties) => ({
  geometry: { geom: null, geom_detail: null },
  associations: { waypoints: [], routes: [] },
  activities: [],
  main_waypoint_id: null,
  climbing_outdoor_type: null,
  rock_free_rating: '5c',
  ...properties,
});

// only the view's watchers are under test: leave out the mixin (loading, routing, user).
// as in EditionContainer, the map is only rendered with a document.
const mountView = (view, documentType, mapRef = 'map') => {
  const fitMapToDocuments = vi.fn();
  const wrapper = mount(
    {
      watch: view.watch,
      methods: view.methods,
      data: () => ({ promise: {}, fields: constants.objectDefinitions[documentType].fields }),
      computed: {
        mode: () => 'add',
        // as in the mixin
        document() {
          return this.promise.data;
        },
      },
      render(h) {
        const map = { methods: { fitMapToDocuments }, render: (h) => h('div') };
        return this.document ? h(map, { ref: mapRef }) : h('div');
      },
    },
    { localVue }
  );
  return { wrapper, fitMapToDocuments };
};

// lets the watchers, their $nextTick callbacks and the report of unhandled rejections run
const settle = () => new Promise((resolve) => setTimeout(resolve));

// the mixin replaces the promise on each route change: the document is null until the API answers
const setDocument = async (wrapper, document) => {
  await wrapper.setData({ promise: { data: document } });
  await settle();
};

describe.each([
  ['route', RouteEditionView, 'map', 'geom'],
  ['waypoint', WaypointEditionView, 'map', 'geom'],
  ['image', ImageEditionView, 'map', 'geom'],
  ['xreport', XreportEditionView, 'map', 'geom'],
  ['profile', ProfileEditionView, 'map', 'geom'],
  ['outing', OutingEditionView, 'mapInput', 'geom_detail'],
])('%s edition view', (documentType, view, mapRef, geometryKey) => {
  beforeEach(() => {
    errors = [];
    process.on('unhandledRejection', onRejection);
  });

  afterEach(() => {
    process.off('unhandledRejection', onRejection);
  });

  it('waits for the reloaded document before fitting the map', async () => {
    const { wrapper, fitMapToDocuments } = mountView(view, documentType, mapRef);
    await setDocument(wrapper, newDocument());

    // e.g. from /routes/add/fr to /routes/edit/12/fr
    await setDocument(wrapper, null);
    await setDocument(wrapper, newDocument());
    expect(errors).toEqual([]);
    expect(fitMapToDocuments).not.toHaveBeenCalled();

    // the user places the document on the map
    wrapper.vm.document.geometry[geometryKey] = POINT;
    await settle();
    expect(errors).toEqual([]);
    expect(fitMapToDocuments).toHaveBeenCalled();
  });

  if (view === RouteEditionView) {
    it('waits for the reloaded document before checking the main waypoint', async () => {
      const { wrapper } = mountView(view, documentType);
      await setDocument(wrapper, newDocument());

      await setDocument(wrapper, null);
      expect(errors).toEqual([]);

      // on creation, the first associated waypoint becomes the main one
      await setDocument(wrapper, newDocument({ associations: { waypoints: [{ document_id: 3 }] } }));
      expect(errors).toEqual([]);
      expect(wrapper.vm.document.main_waypoint_id).toBe(3);
    });
  }

  if (view === OutingEditionView) {
    it('waits for the reloaded document before updating the possible routes', async () => {
      const { wrapper } = mountView(view, documentType, mapRef);
      await setDocument(wrapper, newDocument());
      // the map has been fitted once
      wrapper.vm.bbox = [600000, 5600000, 800000, 5800000];

      await setDocument(wrapper, null);
      await setDocument(wrapper, newDocument());
      expect(errors).toEqual([]);

      // the user changes the activities: no need to really search routes
      const updateRoutes = vi.spyOn(wrapper.vm, 'updateRoutes').mockImplementation(() => {});
      wrapper.vm.document.activities = ['skitouring'];
      await settle();
      expect(updateRoutes).toHaveBeenCalledWith('activities', false);
    });
  }
});
