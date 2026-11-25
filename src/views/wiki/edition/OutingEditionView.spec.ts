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

  it('opens the general informations and the weather & conditions, the other sections stay closed', async () => {
    const edition = mountEdition(OutingEditionView, 'outing');
    edition.setDocument(outing(null));

    await vi.waitFor(() =>
      expect(edition.wrapper.findAllComponents({ name: 'FormSection' }).length).toBeGreaterThan(2)
    );
    const opened = edition.wrapper
      .findAllComponents({ name: 'FormSection' })
      .filter((section) => section.props('expandedOnLoad'))
      .map((section) => section.props('title'));
    expect(opened).toEqual(['General information', 'Weather & conditions']);
  });

  it('links avalanche reports for natural or accidental avalanches in the interface language', async () => {
    const edition = mountEdition(OutingEditionView, 'outing');
    const document = outing(null);
    edition.setDocument(document);
    const reportLink = () => edition.wrapper.findAll('a').find((link) => link.text().trim() === 'Add a report');
    const homeLink = () => edition.wrapper.findAll('a').find((link) => link.text().trim() === 'data-avalanche.org');

    expect(reportLink()).toBeUndefined();
    expect(homeLink()).toBeUndefined();

    edition.document().avalanche_signs = ['natural_avalanche'];
    await vi.waitFor(() =>
      expect(reportLink()?.attributes('href')).toBe('https://www.data-avalanche.org/ReportAnAvalanche?lang=fr')
    );
    expect(homeLink()?.attributes('href')).toBe('https://www.data-avalanche.org/?lang=fr');
    expect(reportLink()?.classes()).not.toContain('external-link');
    expect(homeLink()?.classes()).toContain('external-link');
    const description = edition.wrapper.findAll('p.help span').find((span) => span.text().includes('dedicated'));
    expect(description?.text().startsWith(',')).toBe(true);
    expect(description?.text().length).toBeLessThanOrEqual(200);

    edition.document().avalanche_signs = ['danger_sign', 'accidental_avalanche'];
    edition.language.current = 'it';
    await vi.waitFor(() =>
      expect(reportLink()?.attributes('href')).toBe('https://www.data-avalanche.org/ReportAnAvalanche?lang=it')
    );
    expect(homeLink()?.attributes('href')).toBe('https://www.data-avalanche.org/?lang=it');

    edition.language.current = 'de';
    await vi.waitFor(() =>
      expect(reportLink()?.attributes('href')).toBe('https://www.data-avalanche.org/ReportAnAvalanche?lang=en')
    );
    expect(homeLink()?.attributes('href')).toBe('https://www.data-avalanche.org/?lang=en');

    edition.document().avalanche_signs = ['danger_sign'];
    await vi.waitFor(() => {
      expect(reportLink()).toBeUndefined();
      expect(homeLink()).toBeUndefined();
    });
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

  it('gives back what a picked activity wrote when a GPS file replaces its trace', async () => {
    api.suggestRoutes.mockResolvedValue({ data: { documents: [], total: 0 } });
    const edition = mountEdition(OutingEditionView, 'outing');
    edition.setDocument(outing(null));
    const picker = () => edition.wrapper.findComponent({ name: 'OutingTracePicker' });
    await vi.waitFor(() => expect(picker().exists()).toBe(true));
    edition.setGeometry.mockImplementation(() => (edition.document().geometry!.geom_detail = TRACK));

    picker().vm.$emit('pick', { activity: { id: 1, date: '2026-10-29T08:00:00Z', heightDiffUp: 900 }, geometry: {} });
    await vi.waitFor(() => expect(edition.document().date_start).toBe('2026-10-29'));
    expect(edition.document().height_diff_up).toBe(900);

    // the map row tells of a whole new track before setting it
    edition.wrapper.findComponent({ name: 'MapInputRow' }).vm.$emit('replace');
    edition.document().geometry!.geom_detail = TRACK.replace('763000', '764000');

    expect(edition.document().date_start).toBeUndefined();
    expect(edition.document().height_diff_up).toBeUndefined();
    // the routes of the last track asked for (once, after a pause): nothing left running for the next test
    await vi.waitFor(() => expect(api.suggestRoutes).toHaveBeenCalledOnce());
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
