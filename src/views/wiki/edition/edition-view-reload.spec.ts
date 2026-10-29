import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';

import ImageEditionView from './ImageEditionView.vue';
import OutingEditionView from './OutingEditionView.vue';
import ProfileEditionView from './ProfileEditionView.vue';
import RouteEditionView from './RouteEditionView.vue';
import WaypointEditionView from './WaypointEditionView.vue';
import XreportEditionView from './XreportEditionView.vue';
import { mountEdition } from './edition-test-utils';

import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const api = vi.hoisted(() => ({ getAll: vi.fn() }));

vi.mock('./utils/document-edition', async (importOriginal) => {
  const { fakeEdition } = await import('./edition-test-utils');
  return { ...(await importOriginal<object>()), useDocumentEdition: fakeEdition.use };
});
vi.mock('vue-router', () => ({ useRoute: () => ({ query: {} }) }));
vi.mock('@/js/apis/c2c', () => ({ default: { route: { getAll: api.getAll } } }));

let errors: unknown[];
// async nextTick callbacks reject instead of reporting to the error handler
const onRejection = (error: unknown) => errors.push(error);

const POINT = '{"type":"Point","coordinates":[700000,5700000]}';

const newDocument = (properties: C2cDocument = {}): C2cDocument => ({
  geometry: { geom: null, geom_detail: null },
  associations: { waypoints: [], routes: [] },
  activities: [],
  main_waypoint_id: null,
  climbing_outdoor_type: null,
  rock_free_rating: '5c',
  ...properties,
});

// lets the watchers, their nextTick callbacks and the report of unhandled rejections run
const settle = () => new Promise((resolve) => setTimeout(resolve));

describe.each([
  ['route', RouteEditionView, 'geom'],
  ['waypoint', WaypointEditionView, 'geom'],
  ['image', ImageEditionView, 'geom'],
  ['xreport', XreportEditionView, 'geom'],
  ['profile', ProfileEditionView, 'geom'],
  ['outing', OutingEditionView, 'geom_detail'],
] as [string, Component, 'geom' | 'geom_detail'][])('%s edition view', (documentType, view, geometryKey) => {
  beforeEach(() => {
    errors = [];
    api.getAll.mockResolvedValue({ data: { documents: [], total: 0 } });
    process.on('unhandledRejection', onRejection);
  });

  afterEach(() => {
    process.off('unhandledRejection', onRejection);
    vi.clearAllMocks();
  });

  // the edition replaces the promise on each route change: the document is undefined until the API answers
  const set = async (edition: ReturnType<typeof mountEdition>, doc: C2cDocument | null) => {
    edition.setDocument(doc);
    await settle();
  };

  it('waits for the reloaded document before fitting the map', async () => {
    const edition = mountEdition(view, documentType, errors);
    await set(edition, newDocument());

    // e.g. from /routes/add/fr to /routes/edit/12/fr
    await set(edition, null);
    await set(edition, newDocument());
    expect(errors).toEqual([]);
    expect(edition.fitMapToDocuments).not.toHaveBeenCalled();

    // the user places the document on the map
    edition.document().geometry![geometryKey] = POINT;
    await settle();
    expect(errors).toEqual([]);
    expect(edition.fitMapToDocuments).toHaveBeenCalled();
  });

  if (view === RouteEditionView) {
    it('waits for the reloaded document before checking the main waypoint', async () => {
      const edition = mountEdition(view, documentType, errors);
      await set(edition, newDocument());

      await set(edition, null);
      expect(errors).toEqual([]);

      // on creation, the first associated waypoint becomes the main one
      await set(edition, newDocument({ associations: { waypoints: [{ document_id: 3 }] } }));
      expect(errors).toEqual([]);
      expect(edition.document().main_waypoint_id).toBe(3);
    });
  }

  if (view === OutingEditionView) {
    it('waits for the reloaded document before updating the possible routes', async () => {
      const edition = mountEdition(view, documentType, errors);
      await set(edition, newDocument());
      // the map has been fitted once
      (edition.wrapper.vm as unknown as { bbox: number[] }).bbox = [600000, 5600000, 800000, 5800000];

      await set(edition, null);
      await set(edition, newDocument());
      expect(errors).toEqual([]);

      // the user changes the activities: the possible routes follow
      edition.document().activities = ['skitouring'];
      await settle();
      expect(errors).toEqual([]);
      expect(api.getAll).toHaveBeenCalledWith(expect.objectContaining({ act: 'skitouring' }));
    });
  }
});
