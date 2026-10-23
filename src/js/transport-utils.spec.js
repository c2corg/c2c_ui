import { describe, expect, it } from 'vitest';

import {
  formatInterval,
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
});
