import { describe, expect, it } from 'vitest';

import { formatResultDateTime, isDurationUnknown, marginMinutes, toMinutes } from './transport-accessibility';

describe('transport accessibility', () => {
  describe('isDurationUnknown', () => {
    it('is flagged on the document of the listing, or on its verification result', () => {
      expect(isDurationUnknown({ duration_unknown: true })).toBe(true);
      expect(isDurationUnknown({}, { compatible: null, duration_unknown: true })).toBe(true);
    });

    it('is not for a document whose duration is known', () => {
      expect(isDurationUnknown({ calculated_duration: 0.5 })).toBe(false);
      expect(isDurationUnknown({ duration_unknown: false }, { compatible: true })).toBe(false);
      expect(isDurationUnknown(undefined, null)).toBe(false);
    });
  });

  describe('toMinutes', () => {
    it('reads a plain time as minutes past midnight', () => {
      expect(toMinutes('08:30')).toBe(510);
      expect(toMinutes('08:30:15')).toBe(510);
      expect(toMinutes('')).toBeNull();
      expect(toMinutes('8')).toBeNull();
    });

    it('reads a Navitia datetime so that two days can be subtracted', () => {
      expect(toMinutes('20261025T000000') - toMinutes('20261024T230000')).toBe(60);
      expect(toMinutes('20261024T0835')).toBe(toMinutes('20261024T083500'));
      expect(toMinutes('2026T')).toBeNull();
    });
  });

  describe('marginMinutes', () => {
    const result = (arrival, departure) => ({
      aller: { found: true, arrival },
      retour: { found: true, departure },
    });

    it('is the time between the arrival of the aller and the departure of the retour', () => {
      expect(marginMinutes(result('20261024T091500', '20261024T161500'))).toBe(7 * 60);
    });

    it('spans the days of a trip of several days', () => {
      expect(marginMinutes(result('20261024T091500', '20261026T161500'))).toBe(2 * 24 * 60 + 7 * 60);
    });

    it('wraps plain times that cross midnight', () => {
      expect(marginMinutes(result('23:00', '01:00'))).toBe(120);
    });

    it('is null when a leg is missing', () => {
      expect(
        marginMinutes({ aller: { found: true, arrival: '20261024T091500' }, retour: { found: false } })
      ).toBeNull();
      expect(marginMinutes(null)).toBeNull();
    });
  });

  describe('formatResultDateTime', () => {
    it('shows the time, and the day when it is not the one of reference', () => {
      expect(formatResultDateTime('20261024T083500', '2026-10-24')).toBe('08:35');
      expect(formatResultDateTime('20261026T171500', '2026-10-24')).toBe('26/10 17:15');
      expect(formatResultDateTime('20261026T171500')).toBe('17:15');
      expect(formatResultDateTime('08:35:10')).toBe('08:35');
      expect(formatResultDateTime('')).toBe('');
    });
  });
});
