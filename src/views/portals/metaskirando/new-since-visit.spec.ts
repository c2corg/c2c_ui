import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { partnerOuting } from './fixtures';
import { readDefaultAreaIds, readVisits, writeDefaultAreaIds } from './metaskirando-storage';
import { MAX_SEEN, VISIT_GAP_MS, createVisitTracker } from './new-since-visit';

const outing = (source: string, n: number) => partnerOuting({ id: `${source}:${n}`, source });

describe('new since last visit', () => {
  let time = 1_000_000;
  const tracker = () => createVisitTracker(() => time);

  beforeEach(() => {
    window.localStorage.clear();
    time = 1_000_000;
  });
  afterEach(() => vi.restoreAllMocks());

  it('keeps one record per source in the local storage', () => {
    const visit = tracker();
    visit.observe([outing('skitour', 1), outing('gulliver', 2)]);
    expect(Object.keys(readVisits()).sort()).toEqual(['gulliver', 'skitour']);
    expect(readVisits().skitour).toEqual({ seen: ['skitour:1'], baseline: null, at: time });
    expect(visit.isNew(outing('skitour', 1))).toBe(false);
  });

  it('compares each source with its own previous visit', () => {
    tracker().observe([outing('skitour', 1)]);
    time += VISIT_GAP_MS + 1;
    const visit = tracker();
    visit.observe([outing('skitour', 1), outing('skitour', 2), outing('gulliver', 5)]);
    expect([outing('skitour', 1), outing('skitour', 2), outing('gulliver', 5)].map(visit.isNew)).toEqual([
      false,
      true,
      false,
    ]);
  });

  it('keeps the comparison inside a visit, and starts a new one after the gap', () => {
    tracker().observe([outing('skitour', 1)]);
    time += VISIT_GAP_MS + 1;
    tracker().observe([outing('skitour', 2)]);

    time += 60_000;
    const sameVisit = tracker();
    sameVisit.observe([outing('skitour', 2)]);
    expect(sameVisit.isNew(outing('skitour', 2))).toBe(true);

    time += VISIT_GAP_MS;
    const next = tracker();
    next.observe([outing('skitour', 2), outing('skitour', 3)]);
    expect(next.isNew(outing('skitour', 2))).toBe(false);
    expect(next.isNew(outing('skitour', 3))).toBe(true);
  });

  it('caps what it keeps', () => {
    const many = Array.from({ length: MAX_SEEN + 50 }, (_, n) => outing('skitour', n));
    tracker().observe(many);
    expect(readVisits().skitour.seen).toHaveLength(MAX_SEEN);
    expect(readVisits().skitour.seen.at(-1)).toBe(`skitour:${MAX_SEEN + 49}`);
  });

  it('ignores a storage record that is not what it wrote', () => {
    window.localStorage.setItem('metaskirando.visits', JSON.stringify({ skitour: { seen: 3 }, gulliver: null }));
    expect(readVisits()).toEqual({});
    window.localStorage.setItem('metaskirando.visits', '[1]');
    expect(readVisits()).toEqual({});
    window.localStorage.setItem('metaskirando.visits', '{not json');
    expect(readVisits()).toEqual({});
  });

  it('works without a storage: nothing is new, and nothing throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const visit = tracker();
    expect(() => visit.observe([outing('skitour', 1)])).not.toThrow();
    expect(visit.isNew(outing('skitour', 1))).toBe(false);
    expect(readDefaultAreaIds()).toEqual([]);
    expect(() => writeDefaultAreaIds([1])).not.toThrow();
    expect(() => writeDefaultAreaIds([])).not.toThrow();
  });
});

describe('default areas of a visitor', () => {
  beforeEach(() => window.localStorage.clear());

  it('are remembered as ids, and forgotten with an empty list', () => {
    writeDefaultAreaIds([14409, 14295]);
    expect(readDefaultAreaIds()).toEqual([14409, 14295]);
    writeDefaultAreaIds([]);
    expect(window.localStorage.getItem('metaskirando.areas')).toBeNull();
  });

  it('drops what is not an id', () => {
    window.localStorage.setItem('metaskirando.areas', JSON.stringify([1, 'x', -2, '3', null]));
    expect(readDefaultAreaIds()).toEqual([1, 3]);
    window.localStorage.setItem('metaskirando.areas', '"a"');
    expect(readDefaultAreaIds()).toEqual([]);
  });
});
