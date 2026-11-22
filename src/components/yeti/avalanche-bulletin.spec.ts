import { describe, expect, it } from 'vitest';

import { bulletinRegionId, plainText, toDangerLevel } from './avalanche-bulletin';

describe('bulletinRegionId', () => {
  it('gives the EAWS id of the French massifs only', () => {
    expect(bulletinRegionId('France', 'Mont-Blanc')).toBe('FR-03');
    expect(bulletinRegionId('France', 'Cerdagne-Canigou')).toBe('FR-74');
    // Andorra has its own service
    expect(bulletinRegionId('France', 'Andorre-(massif)')).toBeNull();
    expect(bulletinRegionId('Switzerland', 'Mont-Blanc')).toBeNull();
    expect(bulletinRegionId(null, null)).toBeNull();
  });
});

describe('toDangerLevel', () => {
  it('splits the danger at the elevation threshold', () => {
    expect(
      toDangerLevel([
        { mainValue: 'considerable', validTimePeriod: 'all_day', elevation: { upperBound: '2200' } },
        { mainValue: 'high', validTimePeriod: 'all_day', elevation: { lowerBound: '2200' } },
      ])
    ).toEqual({ low: 3, high: 4, altitude: '2200 m', lowEvol: undefined, highEvol: undefined });
  });

  it('tells the afternoon change only where the danger changes', () => {
    expect(
      toDangerLevel([
        { mainValue: 'considerable', validTimePeriod: 'earlier', elevation: { upperBound: '2500' } },
        { mainValue: 'considerable', validTimePeriod: 'earlier', elevation: { lowerBound: '2500' } },
        { mainValue: 'considerable', validTimePeriod: 'later', elevation: { upperBound: '2500' } },
        { mainValue: 'high', validTimePeriod: 'later', elevation: { lowerBound: '2500' } },
      ])
    ).toEqual({ low: 3, high: 3, altitude: '2500 m', lowEvol: undefined, highEvol: 4 });
  });

  it('has one danger for all elevations', () => {
    expect(toDangerLevel([{ mainValue: 'low', validTimePeriod: 'all_day' }])).toEqual({ low: 1, lowEvol: undefined });
    expect(toDangerLevel([{ mainValue: 'no_rating' }])).toEqual({ low: undefined, lowEvol: undefined });
    expect(toDangerLevel()).toEqual({ low: undefined, lowEvol: undefined });
  });
});

describe('plainText', () => {
  it('keeps the lines and drops the HTML', () => {
    expect(plainText('Neige fraîche.<br/>Plaques <b>récentes</b> &amp; anciennes.<br />Fin')).toBe(
      'Neige fraîche.\nPlaques récentes & anciennes.\nFin'
    );
    expect(plainText('<p>Un</p><p>Deux</p>')).toBe('Un\nDeux');
    // SLF's weather
    expect(plainText('<h2>21.11. 17:00</h2><ul><li>Vent: 37&nbsp;km/h</li><li>Direction: SW</li></ul>')).toBe(
      '21.11. 17:00\n• Vent: 37\u00a0km/h\n• Direction: SW'
    );
    expect(plainText('<img src=x onerror="alert(1)">texte')).toBe('texte');
    expect(plainText(undefined)).toBe('');
  });
});
