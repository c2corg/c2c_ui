import { describe, expect, it } from 'vitest';

import { bulletinRegionId, plainText, toDangerLevel } from './avalanche-bulletin';

describe('bulletinRegionId', () => {
  // a zone as a box: [west, south, east, north]
  const inBox =
    ([west, south, east, north]: number[]) =>
    ([lon, lat]: [number, number]) =>
      lon >= west && lon <= east && lat >= south && lat <= north;

  it('gives the EAWS id of the French massifs', () => {
    expect(bulletinRegionId({ country: 'France', name: 'Mont-Blanc' })).toBe('FR-03');
    expect(bulletinRegionId({ country: 'France', name: 'Cerdagne-Canigou' })).toBe('FR-74');
    // Andorra has its own service
    expect(bulletinRegionId({ country: 'France', name: 'Andorre-(massif)' })).toBeNull();
    expect(bulletinRegionId({ country: null, name: null })).toBeNull();
  });

  it('gives a micro-region of its service that the zone covers', () => {
    // Valle d'Aosta, south-east of Aosta (Champorcher, Gressoney…)
    expect(bulletinRegionId({ country: 'Italy', numZone: 'IT-23', contains: inBox([7.4, 45.5, 8, 45.75]) })).toMatch(
      /^IT-23-AO-/
    );
    // Davos
    expect(
      bulletinRegionId({ country: 'Switzerland', numZone: 'CH', contains: inBox([9.75, 46.75, 9.9, 46.83]) })
    ).toBe('CH-5123');
    // the same box, of another service
    expect(
      bulletinRegionId({ country: 'Italy', numZone: 'IT-23', contains: inBox([9.75, 46.75, 9.9, 46.83]) })
    ).toBeNull();
    // the services of the c2c API only
    expect(bulletinRegionId({ country: 'Norway', numZone: 'NO', contains: () => true })).toBeNull();
    expect(bulletinRegionId({ country: 'Switzerland', name: 'Davos', numZone: 'CH' })).toBeNull();
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
