import { describe, expect, it } from 'vitest';

import { giveBackTracePick, readTracePick, writeTracePick } from './outing-trace-pick';

import type { Activity } from '@/js/apis/tracking-service';

const activity = { id: 7, date: '2026-11-01T08:00:00Z', length: 12345.6, heightDiffUp: 987.4 } as Activity;

describe('a tracker activity picked for an outing', () => {
  it('writes its day and figures, and gives them back when the trace goes', () => {
    const doc = { date_start: '2026-10-30', date_end: '2026-10-31', length_total: 5000 };
    const pick = readTracePick(doc, activity, '2026-11-01', true);
    writeTracePick(pick);
    expect(doc).toMatchObject({ date_start: '2026-11-01', date_end: '2026-11-01', length_total: 12346 });
    expect(doc).toHaveProperty('height_diff_up', 987);

    // the user changed the elevation gain meanwhile: it stays
    Object.assign(doc, { height_diff_up: 1000 });
    const several = giveBackTracePick(pick, false);
    expect(doc).toMatchObject({
      date_start: '2026-10-30',
      date_end: '2026-10-31',
      length_total: 5000,
      height_diff_up: 1000,
    });
    expect(several).toBe(true);
  });

  it('keeps a date the user changed after the pick', () => {
    const doc = { date_start: '2026-10-30', date_end: '2026-10-30' };
    const pick = readTracePick(doc, activity, '2026-11-01', false);
    writeTracePick(pick);
    doc.date_start = '2026-11-02';
    giveBackTracePick(pick, false);
    expect(doc.date_start).toBe('2026-11-02');
  });
});
