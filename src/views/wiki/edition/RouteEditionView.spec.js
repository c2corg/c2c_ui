import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { h } from 'vue';

import RouteEditionView from './RouteEditionView';

import constants from '@/js/constants';

const sharedField = constants.objectDefinitions.route.fields.rock_free_rating;
const sharedValues = [...sharedField.values];

// Vue reports errors thrown in watchers to this handler instead of throwing them
let errors;
const errorHandler = (error) => errors.push(error);

// only the climbing type watcher and the save hooks are under test: leave out the mixin (loading, routing, user)
const mountView = () =>
  shallowMount(
    {
      watch: RouteEditionView.watch,
      methods: RouteEditionView.methods,
      data: () => ({ document: null, fields: constants.objectDefinitions.route.fields }),
      render: () => h('div'),
    },
    { global: { config: { errorHandler } } }
  );

const openRoute = async (properties) => {
  const wrapper = mountView();
  // as in the mixin, the document arrives after the view is created
  await wrapper.setData({ document: { climbing_outdoor_type: null, rock_free_rating: null, ...properties } });
  return wrapper;
};

describe('RouteEditionView', () => {
  it('takes the first associated waypoint as main, when one is added (in place) to a new route', async () => {
    const wrapper = shallowMount(
      {
        compatConfig: RouteEditionView.compatConfig,
        watch: RouteEditionView.watch,
        methods: RouteEditionView.methods,
        data: () => ({ document: null, mode: 'add', fields: constants.objectDefinitions.route.fields }),
        render: () => h('div'),
      },
      { global: { config: { errorHandler } } }
    );
    await wrapper.setData({
      document: {
        climbing_outdoor_type: null,
        rock_free_rating: null,
        main_waypoint_id: null,
        associations: { waypoints: [] },
      },
    });

    // the associations editor adds to the array
    wrapper.vm.document.associations.waypoints.push({ document_id: 5 });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.document.main_waypoint_id).toBe(5);
  });

  beforeEach(() => {
    errors = [];
  });

  it.each([null, 'single', 'bloc'])('opens and saves a route without free rating (climbing type %s)', async (type) => {
    const wrapper = await openRoute({ climbing_outdoor_type: type });

    wrapper.vm.beforeSave();
    wrapper.vm.afterSave();

    expect(errors).toEqual([]);
    expect(wrapper.vm.document.rock_free_rating).toBeNull();
  });

  it('upper-cases the free rating of a bloc route in its own form only', async () => {
    const wrapper = await openRoute({ climbing_outdoor_type: 'bloc', rock_free_rating: '6a' });

    expect(wrapper.vm.document.rock_free_rating).toBe('6A');
    expect(wrapper.vm.fields.rock_free_rating.values).toContain('6A');
    expect(wrapper.vm.fields.rock_free_rating.values).not.toContain('6a');
    // the definition is shared with the next forms and the search filters
    expect(constants.objectDefinitions.route.fields.rock_free_rating).toBe(sharedField);
    expect(sharedField.values).toEqual(sharedValues);

    // the API expects lower-case ratings
    wrapper.vm.beforeSave();
    expect(wrapper.vm.document.rock_free_rating).toBe('6a');
    wrapper.vm.afterSave();
    expect(wrapper.vm.document.rock_free_rating).toBe('6A');

    wrapper.vm.document.climbing_outdoor_type = 'single';
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.document.rock_free_rating).toBe('6a');
    expect(wrapper.vm.fields.rock_free_rating.values).toEqual(sharedValues);
  });
});
