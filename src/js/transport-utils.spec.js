import { describe, expect, it } from 'vitest';

import {
  addDays,
  modeIcon,
  timetableDays,
  formatDay,
  formatInterval,
  isoDate,
  normalizeColour,
  readableTextColour,
  safeWebsite,
  seasonalKind,
  splitLines,
} from './transport-utils';

describe('transport-utils', () => {
  describe('normalizeColour', () => {
    it('keeps hexadecimal colours, expanding the short ones', () => {
      expect(normalizeColour('#AFCA0B', '#000000')).toBe('#afca0b');
      expect(normalizeColour('#f0a', '#000000')).toBe('#ff00aa');
    });

    it('knows the basic colour names', () => {
      expect(normalizeColour(' Red ', '#000000')).toBe('#ff0000');
    });

    it('gives the fallback for anything else', () => {
      expect(normalizeColour('rouge vif', '#123456')).toBe('#123456');
      expect(normalizeColour('#12', '#123456')).toBe('#123456');
      expect(normalizeColour(undefined, '#123456')).toBe('#123456');
    });
  });

  it('reads white on dark backgrounds and black on light ones', () => {
    expect(readableTextColour('#1f6fd1')).toBe('#ffffff');
    expect(readableTextColour('#ffff00')).toBe('#000000');
  });

  describe('formatInterval', () => {
    it('reads minutes and hh:mm', () => {
      expect(formatInterval('30')).toBe('30 min');
      expect(formatInterval('05:00')).toBe('5 h');
      expect(formatInterval('01:30')).toBe('1 h 30');
      expect(formatInterval('00:20:00')).toBe('20 min');
      expect(formatInterval('90')).toBe('1 h 30');
    });

    it('gives null when it does not understand', () => {
      expect(formatInterval('every hour')).toBeNull();
      expect(formatInterval('0')).toBeNull();
      expect(formatInterval(undefined)).toBeNull();
    });
  });

  it('tells the seasons of a line', () => {
    expect(seasonalKind('summer')).toBe('summer');
    expect(seasonalKind('winter')).toBe('winter');
    expect(seasonalKind('winter;summer')).toBe('both');
    expect(seasonalKind('yes')).toBe('seasonal');
    expect(seasonalKind('no')).toBeNull();
    expect(seasonalKind(undefined)).toBeNull();
  });

  it('splits the lines of a stop', () => {
    expect(splitLines('A, Y02,,12')).toEqual(['A', 'Y02', '12']);
    expect(splitLines(undefined)).toEqual([]);
  });

  it('only links to http(s) websites', () => {
    expect(safeWebsite('https://example.org/a')).toBe('https://example.org/a');
    expect(safeWebsite('javascript:alert(1)')).toBeNull();
    expect(safeWebsite('not a url')).toBeNull();
  });

  it('writes and moves days', () => {
    expect(isoDate(new Date(2026, 9, 26))).toBe('2026-10-26');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2026-02-27', 2)).toBe('2026-03-01');
  });

  it('names a day in the language of the page', () => {
    expect(formatDay('2026-10-26', 'en')).toBe('Monday, October 26');
    expect(formatDay('2026-10-26', 'fr')).toBe('lundi 26 octobre');
  });

  it('picks the icon of a mode, a generic one for the others', () => {
    expect(modeIcon('bus')).toBe('bus');
    expect(modeIcon('trolleybus')).toBe('bus');
    expect(modeIcon('light_rail')).toBe('tram');
    expect(modeIcon('train')).toBe('train');
    expect(modeIcon('aerialway')).toBe('public_transport');
    expect(modeIcon(undefined)).toBe('public_transport');
  });

  it('gives the days that the timetables can be asked for', () => {
    expect(timetableDays('2026-10-26')).toEqual(['2026-10-26', '2027-10-26']);
  });
});
