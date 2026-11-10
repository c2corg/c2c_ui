import { describe, expect, it } from 'vitest';

import planATrip from './plan-a-trip-utils';

const transport = (commercial_mode: string, extra = {}) => ({
  type: 'public_transport',
  display_informations: { commercial_mode, ...extra },
});

describe('plan a trip utils', () => {
  it('formats the times and durations of a journey', () => {
    expect(planATrip.formatTime('20261024T083500')).toBe('08:35');
    expect(planATrip.formatTime('')).toBe('');
    expect(planATrip.formatDuration(3900)).toBe('1 h 5 min');
    expect(planATrip.formatDuration(3600)).toBe('1 h ');
    expect(planATrip.formatDuration(600)).toBe('10 min');
    expect(planATrip.formatDuration(0)).toBe('0 min');
    expect(planATrip.formatDuration(undefined)).toBe('');
    expect(planATrip.formatJourneyDuration(3900)).toBe('1h05');
    expect(planATrip.formatJourneyDuration(600)).toBe('10 min');
  });

  it('gives the icon and class of each transport mode', () => {
    expect(
      ['Bus', 'Tramway', 'Métro', 'Train TER', 'Car'].map((mode) => planATrip.getTransportIcon(transport(mode)))
    ).toEqual(['bus', 'tram', 'tram', 'train', 'bus']);
    expect(planATrip.getTransportClass(transport('TER train'))).toBe('train');
    expect(planATrip.getTransportIcon({})).toBe('');
  });

  it('gives the distance, accessibility, colors and duration of a section', () => {
    expect(planATrip.getDistance({ distance: 120.6 })).toBe(121);
    expect(planATrip.getDistance({ path: [{ length: 100 }, { length: 50.4 }] })).toBe(150);
    expect(planATrip.getDistance({})).toBe(0);

    expect(planATrip.getAccessibilityIcon(transport('Bus', { equipments: ['has_wheelchair'] }))).toEqual({
      bike: false,
      wheelchair: true,
    });

    expect(planATrip.getRouteColor({ mode: 'walking' })).toBe('00008B');
    expect(planATrip.getRouteColor(transport('Bus', { color: 'FFFFFF' }))).toBe('808080');
    expect(planATrip.getRouteColor(transport('Bus', { color: 'E2001A' }))).toBe('E2001A');
    expect(planATrip.getTransportColorClass(transport('Bus', { color: '#E2001A' }))).toBe('transport-color-E2001A');
    expect(planATrip.getTransportColorClass({})).toBe('transport-color-default');

    expect(planATrip.calculateSectionDuration({ duration: 0 })).toBe(0);
    expect(planATrip.calculateSectionDuration({})).toBe(0);
  });
});
