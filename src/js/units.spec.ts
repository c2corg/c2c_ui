import { describe, expect, it } from 'vitest';

import { displayValueAndUnit, distance, elevation } from './units';

describe('units', () => {
  it('shows the metric values as they are, divided as the fields ask', () => {
    expect(displayValueAndUnit(4810, 'm', null, 'metric')).toEqual({ value: 4810, unit: 'm' });
    expect(displayValueAndUnit(12500, 'km', 1000, undefined)).toEqual({ value: 13, unit: 'km' });
    expect(displayValueAndUnit('5c', 'm', null, 'imperial')).toEqual({ value: '5c', unit: 'm' });
  });

  it('converts meters and kilometers in imperial, and only them', () => {
    expect(displayValueAndUnit(4810, 'm', null, 'imperial')).toEqual({ value: 15781, unit: 'ft' });
    expect(displayValueAndUnit(12500, 'km', 1000, 'imperial')).toEqual({ value: 7.8, unit: 'mi' });
    expect(displayValueAndUnit(45, '°', null, 'imperial')).toEqual({ value: 45, unit: '°' });
  });

  it('gives distances and elevations in the chosen system', () => {
    expect(distance(12345, 'metric')).toEqual({ value: 12.3, unit: 'km' });
    expect(distance(12345, 'imperial')).toEqual({ value: 7.7, unit: 'mi' });
    expect(elevation(987.4, 'metric')).toEqual({ value: 987, unit: 'm' });
    expect(elevation(987.4, 'imperial')).toEqual({ value: 3240, unit: 'ft' });
  });
});
