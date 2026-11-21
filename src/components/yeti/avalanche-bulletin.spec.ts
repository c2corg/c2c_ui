import { describe, expect, it } from 'vitest';

import { bulletinRegionId, toDangerLevel } from './avalanche-bulletin';

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
