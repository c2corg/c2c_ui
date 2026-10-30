import { describe, expect, it } from 'vitest';

import checkPasswordRules, { MINIMUM_PASSWORD_LENGTH } from './password-rules';

// Expected values below mirror is_password_strong_enough() and MINIMUM_PASSWORD_LENGTH in v6_api
// (c2corg_api/views/user.py), i.e. Python's len(), str.islower(), str.isupper(), str.isdigit(),
// str.isalnum() and str.isspace() applied to each character.

const NONE = { length: false, lower: false, upper: false, digit: false, special: false };

describe('MINIMUM_PASSWORD_LENGTH', () => {
  it('is 10, like the API', () => {
    expect(MINIMUM_PASSWORD_LENGTH).toBe(10);
  });
});

describe('checkPasswordRules', () => {
  it.each([undefined, null, ''])('fails every rule for %j', (value) => {
    expect(checkPasswordRules(value)).toEqual(NONE);
  });

  it('passes every rule for a strong password', () => {
    expect(checkPasswordRules('Abcdefgh1!')).toEqual({
      length: true,
      lower: true,
      upper: true,
      digit: true,
      special: true,
    });
  });

  describe('length', () => {
    it('requires at least 10 characters', () => {
      expect(checkPasswordRules('a'.repeat(9)).length).toBe(false);
      expect(checkPasswordRules('a'.repeat(10)).length).toBe(true);
      expect(checkPasswordRules('a'.repeat(50)).length).toBe(true);
    });

    it('counts code points, not UTF-16 code units', () => {
      // each emoji is 2 UTF-16 code units, but 1 character for Python's len()
      expect('😀'.repeat(9)).toHaveLength(18);
      expect(checkPasswordRules('😀'.repeat(9)).length).toBe(false);
      expect(checkPasswordRules('😀'.repeat(10)).length).toBe(true);
    });

    it('counts combining marks as separate characters, like Python', () => {
      // 'e' + U+0301 COMBINING ACUTE ACCENT: 1 grapheme, 2 code points
      expect(checkPasswordRules('é'.repeat(5)).length).toBe(true);
    });

    it('counts spaces', () => {
      expect(checkPasswordRules('          ').length).toBe(true);
    });
  });

  describe('lower', () => {
    it.each(['a', 'z', 'é', 'ß', 'ø', 'я', 'ω'])('accepts %j', (c) => {
      expect(checkPasswordRules(c).lower).toBe(true);
    });

    it.each(['A', 'É', '1', '!', ' ', '中', '😀'])('rejects %j', (c) => {
      expect(checkPasswordRules(c).lower).toBe(false);
    });
  });

  describe('upper', () => {
    it.each(['A', 'Z', 'É', 'Ø', 'Я', 'Ω'])('accepts %j', (c) => {
      expect(checkPasswordRules(c).upper).toBe(true);
    });

    it.each(['a', 'é', '1', '!', ' ', '中', 'ǅ'])('rejects %j', (c) => {
      // 'ǅ' is titlecase: neither islower() nor isupper() in Python
      expect(checkPasswordRules(c).upper).toBe(false);
    });
  });

  describe('digit', () => {
    it.each(['0', '9', '٣', '५'])('accepts %j', (c) => {
      // Arabic-Indic and Devanagari digits are decimal digits for Python too
      expect(checkPasswordRules(c).digit).toBe(true);
    });

    it.each(['a', 'A', '!', ' ', 'Ⅻ', '½'])('rejects %j', (c) => {
      expect(checkPasswordRules(c).digit).toBe(false);
    });
  });

  describe('special', () => {
    it.each(['!', '@', '#', '-', '_', '.', '€', '😀', '́'])('accepts %j', (c) => {
      expect(checkPasswordRules(c).special).toBe(true);
    });

    it.each(['a', 'A', 'é', '1', '٣', '½', '²', '中', ' ', '\t', '\n', ' '])('rejects %j', (c) => {
      // letters, numbers (including '½' and '²', which are isalnum() in Python) and whitespace
      expect(checkPasswordRules(c).special).toBe(false);
    });
  });

  // Characters where Unicode general categories (\p{Ll}, \p{Lu}, \p{Nd}, \s) differ from Python's
  // str.islower(), str.isupper(), str.isdigit() and str.isspace()
  describe('Python parity', () => {
    it.each(['²', '₃', '①', '❶', '🄂'])('accepts Numeric_Type=Digit %j as a digit, like str.isdigit()', (c) => {
      expect(checkPasswordRules(c).digit).toBe(true);
    });

    it.each(['ª', 'ʰ', 'ⓐ'])('accepts Other_Lowercase %j as lowercase, like str.islower()', (c) => {
      expect(checkPasswordRules(c).lower).toBe(true);
    });

    it.each(['Ⅻ', 'Ⓐ'])('accepts Other_Uppercase %j as uppercase, like str.isupper()', (c) => {
      expect(checkPasswordRules(c).upper).toBe(true);
    });

    it.each(['\x1c', '\x1f', '\x85'])('does not count %j as special, as str.isspace() is true', (c) => {
      expect(checkPasswordRules(c).special).toBe(false);
    });

    it('counts U+FEFF as special, as str.isspace() is false', () => {
      expect(checkPasswordRules('\uFEFF').special).toBe(true);
    });
  });
});
