import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import OutingEditionView from './OutingEditionView.vue';
import { mountEdition } from './edition-test-utils';
import { encodeTrack } from './utils/route-proposals';

import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const api = vi.hoisted(() => ({ getAll: vi.fn(), suggestRoutes: vi.fn() }));

vi.mock('./utils/document-edition', async (importOriginal) => {
  const { fakeEdition } = await import('./edition-test-utils');
  return { ...(await importOriginal<object>()), useDocumentEdition: fakeEdition.use };
});
vi.mock('vue-router', () => ({ useRoute: () => ({ query: {} }) }));
vi.mock('@/js/apis/c2c', () => ({ default: { route: { getAll: api.getAll }, suggestRoutes: api.suggestRoutes } }));

const TRACK = JSON.stringify({
  type: 'LineString',
  coordinates: [
    [763000, 5765000],
    [762000, 5767000],
    [765000, 5769000],
  ],
});

const outing = (geomDetail: string | null): C2cDocument => ({
  geometry: { geom: null, geom_detail: geomDetail },
  associations: { waypoints: [], routes: [] },
  activities: [],
});

const route = (id: number): C2cDocument => ({ document_id: id, type: 'r', activities: ['skitouring'], locales: [] });

describe('OutingEditionView', () => {
  beforeEach(() => {
    api.getAll.mockResolvedValue({ data: { documents: [], total: 0 } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists the routes the track followed, 10 first, then more on demand', async () => {
    const suggested = Array.from({ length: 25 }, (_, i) => route(i + 1));
    api.suggestRoutes.mockResolvedValue({ data: { documents: suggested, total: 25 } });
    const errors: unknown[] = [];
    const edition = mountEdition(OutingEditionView, 'outing', errors);

    // the outing gets a track: the routes it followed are asked for once
    edition.setDocument(outing(null));
    await vi.waitFor(() => expect(edition.fitMapToDocuments).not.toHaveBeenCalled());
    edition.document().geometry!.geom_detail = TRACK;
    await vi.waitFor(() => expect(api.suggestRoutes).toHaveBeenCalledOnce());
    expect(api.suggestRoutes).toHaveBeenCalledWith(encodeTrack(TRACK), { limit: 100 });

    const button = () => edition.wrapper.findAll('button').find((b) => b.text().startsWith('Show more routes'));
    await vi.waitFor(() => expect(button()?.text()).toBe('Show more routes (15)'));
    await button()!.trigger('click');
    expect(button()).toBeUndefined();
    expect(errors).toEqual([]);
  });

  it('prefills the activities of the tracking device activity whose track is used', async () => {
    api.suggestRoutes.mockResolvedValue({ data: { documents: [], total: 0 } });
    const edition = mountEdition(OutingEditionView, 'outing');
    edition.setDocument(outing(null));
    await vi.waitFor(() => expect(edition.wrapper.findComponent({ name: 'MapInputRow' }).exists()).toBe(true));

    edition.wrapper.findComponent({ name: 'MapInputRow' }).vm.$emit('activities', ['skitouring']);

    expect(edition.document().activities).toEqual(['skitouring']);
  });

  it('keeps the activities already chosen', async () => {
    api.suggestRoutes.mockResolvedValue({ data: { documents: [], total: 0 } });
    const edition = mountEdition(OutingEditionView, 'outing');
    edition.setDocument({ ...outing(null), activities: ['hiking'] });
    await vi.waitFor(() => expect(edition.wrapper.findComponent({ name: 'MapInputRow' }).exists()).toBe(true));

    edition.wrapper.findComponent({ name: 'MapInputRow' }).vm.$emit('activities', ['skitouring']);

    expect(edition.document().activities).toEqual(['hiking']);
  });

  it('does not draw the proposed routes on the map', async () => {
    api.suggestRoutes.mockResolvedValue({ data: { documents: [route(1)], total: 1 } });
    const edition = mountEdition(OutingEditionView, 'outing');
    edition.setDocument(outing(TRACK));
    await vi.waitFor(() => expect(api.suggestRoutes).toHaveBeenCalledOnce());

    // the map input gets the outing only
    const map = edition.wrapper.find('.field[document]');
    expect(map.exists()).toBe(true);
    expect(map.attributes()).not.toHaveProperty('documents');
  });
});
