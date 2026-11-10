import Polyline from 'ol/format/Polyline';
import { LineString } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';

import { DEBOUNCE, MORE, PAGE, encodeTrack, normalize, useRouteProposals } from './route-proposals';

import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const api = vi.hoisted(() => ({ getAll: vi.fn(), suggestRoutes: vi.fn() }));
vi.mock('@/js/apis/c2c', () => ({
  default: { route: { getAll: api.getAll }, suggestRoutes: api.suggestRoutes },
}));

const BBOX = [600000, 5600000, 800000, 5800000];

const lineString = (points: number[][]) =>
  JSON.stringify({ type: 'LineString', coordinates: points.map((point) => fromLonLat(point)) });
// not straight: the simplification keeps the 3 points
const TRACK = lineString([
  [6.86, 45.9],
  [6.84, 45.92],
  [6.88, 45.94],
]);

const decode = (encoded: string) =>
  (new Polyline().readGeometry(encoded) as LineString).getCoordinates().map(([lon, lat]) => [lon, lat]);

const route = (id: number, title: string, activities = ['skitouring']): C2cDocument => ({
  document_id: id,
  type: 'r',
  activities,
  locales: [{ lang: 'fr', title }],
});

const page = (documents: C2cDocument[], total = documents.length) => ({ data: { documents, total } });

// a promise resolved by the test, for the answers that come in another order
function deferred() {
  let resolve!: (value: unknown) => void;
  const promise = new Promise((done) => (resolve = done));
  return { promise, resolve };
}

describe('encodeTrack', () => {
  it('encodes a line of EPSG:3857 as a polyline of lon, lat', () => {
    const points = decode(encodeTrack(TRACK)!);
    expect(points).toHaveLength(3);
    expect(points[0][0]).toBeCloseTo(6.86, 5);
    expect(points[0][1]).toBeCloseTo(45.9, 5);
    expect(points[2][1]).toBeCloseTo(45.94, 5);
  });

  it('joins the lines of a multi-day track and drops elevation and time', () => {
    const [a, b, c] = [
      [6.86, 45.9],
      [6.84, 45.92],
      [6.88, 45.94],
    ].map((point) => [...fromLonLat(point), 1500, 1700000000]);
    const multi = JSON.stringify({ type: 'MultiLineString', coordinates: [[a, b], [c]] });
    expect(decode(encodeTrack(multi)!)).toHaveLength(3);
  });

  it('simplifies a long track to 1000 points at most', () => {
    // 5000 points in zigzag, each one 50 m from the previous one
    const points = Array.from({ length: 5000 }, (_, i) => [600000 + i * 50, 5700000 + (i % 2) * 50]);
    const track = JSON.stringify({ type: 'LineString', coordinates: points });
    const length = decode(encodeTrack(track)!).length;
    expect(length).toBeGreaterThan(1);
    expect(length).toBeLessThanOrEqual(1000);
  });

  it('gives null without a line', () => {
    expect(encodeTrack(null)).toBeNull();
    expect(encodeTrack('not json')).toBeNull();
    expect(encodeTrack('{"type":"Point","coordinates":[700000,5700000]}')).toBeNull();
    expect(encodeTrack('{"type":"LineString","coordinates":[[700000,5700000]]}')).toBeNull();
  });
});

describe('normalize', () => {
  it('ignores case and accents', () => {
    expect(normalize(' Écrins ')).toBe('ecrins');
    expect(normalize('Aiguille du Goûter')).toContain('gouter');
  });
});

describe('useRouteProposals', () => {
  let scope: ReturnType<typeof effectScope>;
  let associated: ReturnType<typeof ref<C2cDocument[]>>;
  let activities: ReturnType<typeof ref<string[]>>;

  beforeEach(() => {
    vi.useFakeTimers();
    associated = ref<C2cDocument[]>([]);
    activities = ref<string[]>([]);
    api.getAll.mockResolvedValue(page([]));
    api.suggestRoutes.mockResolvedValue(page([]));
  });

  afterEach(() => {
    scope.stop();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  function proposals() {
    scope = effectScope();
    return scope.run(() =>
      useRouteProposals({
        associated: () => associated.value!,
        activities: () => activities.value!,
        title: (doc) => doc.locales![0].title!,
      })
    )!;
  }

  // the debounced requests sent, and their answers handled
  async function wait() {
    await nextTick();
    await vi.advanceTimersByTimeAsync(DEBOUNCE);
  }

  const ids = (routes: C2cDocument[]) => routes.map((doc) => doc.document_id);

  it('suggests the routes of a track, best first, once the track is set', async () => {
    api.suggestRoutes.mockResolvedValue(page([route(3, 'Couloir'), route(1, 'Arête')]));
    const p = proposals();
    p.suggest(TRACK);
    await wait();
    expect(api.suggestRoutes).toHaveBeenCalledOnce();
    expect(api.suggestRoutes).toHaveBeenCalledWith(encodeTrack(TRACK), { limit: 100 });
    // the suggestion order, not the titles
    expect(ids(p.routes.value)).toEqual([3, 1]);
  });

  it('filters the suggestions on the name and the activities without a request', async () => {
    api.suggestRoutes.mockResolvedValue(
      page([route(1, 'Arête des Écrins'), route(2, 'Couloir', ['hiking']), route(3, 'Face des ecrins', ['hiking'])])
    );
    const p = proposals();
    p.suggest(TRACK);
    await wait();
    api.getAll.mockClear();

    activities.value = ['hiking'];
    await nextTick();
    expect(ids(p.routes.value)).toEqual([2, 3]);

    p.text.value = 'ECRINS';
    await nextTick();
    expect(ids(p.routes.value)).toEqual([3]);
    // no box yet: no search either
    await wait();
    expect(api.getAll).not.toHaveBeenCalled();
  });

  it('shows the associated routes first and does not propose them again', async () => {
    api.suggestRoutes.mockResolvedValue(page([route(1, 'A'), route(2, 'B')]));
    associated.value = [route(2, 'B')];
    const p = proposals();
    p.suggest(TRACK);
    await wait();
    expect(ids(p.routes.value)).toEqual([2, 1]);
  });

  it('adds the routes of a search below the suggestions, once each', async () => {
    api.suggestRoutes.mockResolvedValue(page([route(1, 'Arête'), route(2, 'Couloir')]));
    api.getAll.mockResolvedValue(page([route(9, 'Zeta'), route(2, 'Couloir'), route(8, 'Beta')]));
    const p = proposals();
    p.moveMap(BBOX, false);
    p.suggest(TRACK);
    await wait();
    // with suggestions, no search until a name is typed or the map is moved
    expect(ids(p.routes.value)).toEqual([1, 2]);

    p.text.value = 'a';
    await wait();
    expect(api.getAll).toHaveBeenLastCalledWith({ limit: 50, bbox: BBOX.join(','), q: 'a' });
    // the suggestions matching "a", then the other routes of the search, by title: Couloir is one of them, found by
    // the search though its title has no "a"
    expect(ids(p.routes.value)).toEqual([1, 8, 2, 9]);
  });

  it('searches when the user moves the map, not when the editor places it', async () => {
    api.suggestRoutes.mockResolvedValue(page([route(1, 'Arête')]));
    api.getAll.mockResolvedValue(page([route(5, 'Dalle')]));
    const p = proposals();
    p.suggest(TRACK);
    await wait();

    p.moveMap(BBOX, false);
    await wait();
    expect(ids(p.routes.value)).toEqual([1]);

    p.moveMap([1, 2, 3, 4]);
    await wait();
    expect(ids(p.routes.value)).toEqual([1, 5]);
  });

  it('searches in the map box without a track, as before', async () => {
    api.getAll.mockResolvedValue(page([route(2, 'B'), route(1, 'A')], 120));
    const p = proposals();
    p.moveMap(BBOX, false);
    await wait();
    expect(ids(p.routes.value)).toEqual([1, 2]);
    expect(p.moreResults.value).toBe(true);
  });

  it('sends one request when the user stops typing', async () => {
    const p = proposals();
    p.moveMap(BBOX, false);
    await wait();
    api.getAll.mockClear();

    for (const text of ['m', 'mo', 'mon', 'mont']) {
      p.text.value = text;
      await nextTick();
      await vi.advanceTimersByTimeAsync(DEBOUNCE / 3);
    }
    expect(api.getAll).not.toHaveBeenCalled();
    await wait();
    expect(api.getAll).toHaveBeenCalledOnce();
    expect(api.getAll).toHaveBeenCalledWith(expect.objectContaining({ q: 'mont' }));
  });

  it('drops the answer of an older search', async () => {
    const p = proposals();
    p.bbox.value = BBOX;
    const first = deferred();
    const second = deferred();
    api.getAll.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const older = p.searchNow();
    const newer = p.searchNow();
    second.resolve(page([route(2, 'New')]));
    await newer;
    first.resolve(page([route(1, 'Old')]));
    await older;
    expect(ids(p.routes.value)).toEqual([2]);
  });

  it('drops the suggestions of an older track', async () => {
    const first = deferred();
    api.suggestRoutes.mockReturnValueOnce(first.promise).mockResolvedValueOnce(page([route(2, 'New')]));
    const p = proposals();
    p.suggest(TRACK);
    await wait();
    p.suggest(
      lineString([
        [6.0, 45.0],
        [6.1, 45.1],
      ])
    );
    await wait();
    first.resolve(page([route(1, 'Old')]));
    await wait();
    expect(ids(p.routes.value)).toEqual([2]);
  });

  it('forgets the suggestions when the track is removed', async () => {
    api.suggestRoutes.mockResolvedValue(page([route(1, 'Arête')]));
    api.getAll.mockResolvedValue(page([route(5, 'Dalle')]));
    const p = proposals();
    p.moveMap(BBOX, false);
    p.suggest(TRACK);
    await wait();
    expect(ids(p.routes.value)).toEqual([1]);

    p.suggest(null);
    await wait();
    expect(p.suggestions.value).toBeNull();
    expect(ids(p.routes.value)).toEqual([5]);
  });

  it('searches in the map box when the suggestions fail', async () => {
    api.suggestRoutes.mockRejectedValue(new Error('404'));
    api.getAll.mockResolvedValue(page([route(5, 'Dalle')]));
    const p = proposals();
    p.moveMap(BBOX, false);
    p.suggest(TRACK);
    await wait();
    expect(p.suggestions.value).toBeNull();
    expect(ids(p.routes.value)).toEqual([5]);
  });

  it('shows 10 routes first, 20 more on demand, 10 again for a new name', async () => {
    const many = Array.from({ length: 45 }, (_, i) => route(i + 1, `Voie ${i + 1}`));
    api.suggestRoutes.mockResolvedValue(page(many));
    const p = proposals();
    p.suggest(TRACK);
    await wait();
    expect(p.routes.value).toHaveLength(PAGE);
    expect(p.hidden.value).toBe(45 - PAGE);

    p.showMore();
    expect(p.routes.value).toHaveLength(PAGE + MORE);
    p.showMore();
    expect(p.routes.value).toHaveLength(45);
    expect(p.hidden.value).toBe(0);

    p.text.value = 'voie';
    await nextTick();
    expect(p.routes.value).toHaveLength(PAGE);
  });

  it('does not count the associated routes in the limit', async () => {
    const many = Array.from({ length: 15 }, (_, i) => route(i + 1, `Voie ${i + 1}`));
    api.suggestRoutes.mockResolvedValue(page(many));
    associated.value = [route(100, 'Associated'), route(101, 'Associated too')];
    const p = proposals();
    p.suggest(TRACK);
    await wait();
    expect(p.routes.value).toHaveLength(2 + PAGE);
    expect(p.hidden.value).toBe(15 - PAGE);
  });
});
