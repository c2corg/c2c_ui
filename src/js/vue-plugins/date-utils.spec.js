import { describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';

import dateUtils from './date-utils';

const install = (lang = 'fr') => {
  const app = createApp({});
  app.use(dateUtils);
  // $language is installed after $dateUtils by main.ts: read when called
  app.config.globalProperties.$language = { current: lang };
  return app.config.globalProperties.$dateUtils;
};

describe('$dateUtils', () => {
  it('formats dates in the current language', () => {
    expect(install('fr').toLocalizedString('2026-07-14', 'D MMMM YYYY')).toBe('14 juillet 2026');
    expect(install('de').toLocalizedString('2026-07-14', 'D MMMM YYYY')).toBe('14 Juli 2026');
    expect(install('fr').toTechnicalString('2026-07-14T08:05:09')).toBe('2026-07-14 08:05:09');
  });

  it.each([
    ['fr', 'mardi 14 juillet 2026'],
    ['it', 'martedì 14 luglio 2026'],
    ['en', 'Tuesday 14 July 2026'],
    ['de', 'Dienstag 14. Juli 2026'],
    ['sl', 'torek 14. julij 2026'],
    ['ca', 'Dimarts 14 Juliol de 2026'], // dayjs capitalizes Catalan names
    ['es', 'martes 14 de julio de 2026'],
    ['eu', 'asteartea 2026ko uztailaren 14a'],
    ['hu', '2026. július 14., kedd'],
    ['zh_CN', '2026年7月14日星期二'],
  ])('formats @1 dates the way %s writes them', (lang, expected) => {
    expect(install(lang).toLocalizedString('2026-07-14', '@1')).toBe(expected);
  });

  it('names months in the current language', () => {
    expect(install('fr').month(6)).toBe('juillet');
    expect(install('en').month(0)).toBe('January');
  });

  it('tells how long ago a date was', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-19T12:00:00Z'));

    expect(install('fr').timeAgo('2026-10-17T12:00:00Z')).toBe('il y a 2 jours');

    vi.useRealTimers();
  });

  it('parses dates with a format', () => {
    expect(install().parseDate('14/07/2026', 'DD/MM/YYYY')).toEqual(new Date(2026, 6, 14));
  });

  it('formats durations as hh:mm:ss', () => {
    expect(install().durationToTimeString(3725)).toBe('01:02:05');
    expect(install().durationToTimeString(59)).toBe('00:00:59');
  });

  it('compares years, months and days', () => {
    const utils = install();
    expect(utils.isSameYear('2026-01-01', '2026-12-31')).toBe(true);
    expect(utils.isSameMonth('2026-01-31', '2026-02-01')).toBe(false);
    expect(utils.isSameDay('2026-07-14T01:00', '2026-07-14T23:00')).toBe(true);
  });

  it('detects periods made of a single run of months', () => {
    const utils = install();
    expect(utils.hasSinglePeriod([false, true, true, true, false, false])).toBe(true);
    expect(utils.hasSinglePeriod([true, false, true, false])).toBe(false);
    expect(utils.hasSinglePeriod([false, true, false])).toBe(false);
  });
});
