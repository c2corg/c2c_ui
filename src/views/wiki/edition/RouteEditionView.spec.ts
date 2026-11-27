import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import RouteEditionView from './RouteEditionView.vue';
import { mountEdition } from './edition-test-utils';

import constants from '@/js/constants';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

vi.mock('./utils/document-edition', async (importOriginal) => {
  const { fakeEdition } = await import('./edition-test-utils');
  return { ...(await importOriginal<object>()), useDocumentEdition: fakeEdition.use };
});
vi.mock('vue-router', () => ({ useRoute: () => ({ query: {} }) }));

const sharedField = constants.objectDefinitions.route.fields.rock_free_rating;
const sharedValues = [...(sharedField.values as string[])];

let errors: unknown[];

// as in the edition, the document arrives after the view is created
const openRoute = async (properties: C2cDocument) => {
  const edition = mountEdition(RouteEditionView, 'route', errors);
  edition.setDocument({ activities: [], climbing_outdoor_type: null, rock_free_rating: null, ...properties });
  await flushPromises();
  return edition;
};

beforeEach(() => {
  errors = [];
});

describe('RouteEditionView', () => {
  it('takes the first associated waypoint as main, when one is added (in place) to a new route', async () => {
    const { document } = await openRoute({ main_waypoint_id: null, associations: { waypoints: [] } });

    // the associations editor adds to the array
    document().associations!.waypoints!.push({ document_id: 5 });
    await nextTick();

    expect(document().main_waypoint_id).toBe(5);
  });

  it.each([null, 'single', 'bloc'])('opens and saves a route without free rating (climbing type %s)', async (type) => {
    const { hooks, document } = await openRoute({ climbing_outdoor_type: type });

    hooks().beforeSave!();
    hooks().afterSave!();

    expect(errors).toEqual([]);
    expect(document().rock_free_rating).toBeNull();
  });

  it('upper-cases the free rating of a bloc route in its own form only', async () => {
    const { hooks, document, fields } = await openRoute({ climbing_outdoor_type: 'bloc', rock_free_rating: '6a' });

    expect(document().rock_free_rating).toBe('6A');
    expect(fields.value.rock_free_rating.values).toContain('6A');
    expect(fields.value.rock_free_rating.values).not.toContain('6a');
    // the definition is shared with the next forms and the search filters
    expect(constants.objectDefinitions.route.fields.rock_free_rating).toBe(sharedField);
    expect(sharedField.values).toEqual(sharedValues);

    // the API expects lower-case ratings
    hooks().beforeSave!();
    expect(document().rock_free_rating).toBe('6a');
    hooks().afterSave!();
    expect(document().rock_free_rating).toBe('6A');

    document().climbing_outdoor_type = 'single';
    await nextTick();
    expect(document().rock_free_rating).toBe('6a');
    expect(fields.value.rock_free_rating.values).toEqual(sharedValues);
  });
});
