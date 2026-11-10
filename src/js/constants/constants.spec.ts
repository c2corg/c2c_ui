import { describe, expect, it } from 'vitest';

import constants from '.';

const routeField = (name: string) => constants.objectDefinitions.route.fields[name];

describe('constants', () => {
  it('lists the document types, by name and by letter', () => {
    expect(constants.documentTypes).toEqual(
      expect.arrayContaining(['area', 'article', 'book', 'image', 'outing', 'profile', 'route', 'waypoint', 'xreport'])
    );
    expect(constants.letterToDocumentType).toMatchObject({ r: 'route', w: 'waypoint', o: 'outing', u: 'profile' });
    expect(constants.objectDefinitions.route.documentType).toBe('route');
    expect(constants.activities).toContain('skitouring');
  });

  it('gives each field its properties, with the values of common attributes and the document properties', () => {
    const quality = routeField('quality');
    expect(quality.values).toEqual(constants.quality_types);
    expect(quality.i18nContext).toBe('quality_types');

    const elevation = routeField('elevation_max');
    expect(elevation).toMatchObject({ name: 'elevation_max', type: 'number', parent: 'document', url: 'rmaxa' });
    expect(elevation.activities).toContain('hiking');
  });
});

describe('Field', () => {
  it('derives its query mode and default URL query from its type', () => {
    expect(routeField('elevation_max')).toMatchObject({
      queryMode: 'numericalRangeSlider',
      defaultUrlQuery: '0,9000',
    });
    expect(routeField('lift_access')).toMatchObject({ queryMode: 'tristate', defaultUrlQuery: '' });
    expect(routeField('waypoints')).toMatchObject({ queryMode: 'input-document', defaultUrlQuery: '' });
    expect(routeField('configuration')).toMatchObject({ queryMode: 'multiSelect', defaultUrlQuery: '' });
    const globalRating = routeField('global_rating');
    expect(globalRating.defaultUrlQuery).toBe(
      `${globalRating.values?.[0]},${globalRating.values?.[globalRating.values.length - 1]}`
    );
  });

  it('converts values to URL queries, and back', () => {
    const elevation = routeField('elevation_max');
    expect(elevation.valueToUrl([500, 3000])).toBe('500,3000');
    expect(elevation.urlToValue('500,3000')).toEqual([500, 3000]);
    expect(elevation.urlToValue(undefined)).toEqual([0, 9000]);

    const configuration = routeField('configuration');
    expect(configuration.valueToUrl(['edge', 'pillar'])).toBe('edge,pillar');
    expect(configuration.urlToValue('edge,pillar')).toEqual(['edge', 'pillar']);
    expect(configuration.urlToValue('')).toEqual([]);

    const liftAccess = routeField('lift_access');
    expect(['yes', 'no', 'no info', 'other'].map((value) => liftAccess.valueToUrl(value))).toEqual([
      'true',
      'false',
      'null',
      '',
    ]);
    expect(['true', 'false', 'null', 'x'].map((url) => liftAccess.urlToValue(url))).toEqual([
      'yes',
      'no',
      'no info',
      undefined,
    ]);

    const waypoints = routeField('waypoints');
    expect(waypoints.urlToValue('12,34')).toEqual([12, 34]);
    expect(waypoints.valueToUrl([12, 34])).toBe('12,34');

    const title = routeField('title');
    expect(title.urlToValue('Mont Blanc')).toBe('Mont Blanc');
    expect(title.valueToUrl('Mont Blanc')).toBe('Mont Blanc');
  });

  it('checks the required fields and the lengths, named as the API names its errors', () => {
    const title = routeField('title');
    const route = { type: 'r', activities: ['hiking'] };

    expect(title.getError(route, { title: '' })).toEqual({ name: 'locales.0.title', description: 'required field' });
    expect(title.getError(route, { title: 'ab' })).toEqual({
      name: 'locales.0.title',
      description: 'This field is too short',
    });
    expect(title.getError(route, { title: '山' })).toBeNull(); // Chinese titles may be shorter
    expect(title.getError(route, { title: 'Arête des Cosmiques' })).toBeNull();

    expect(routeField('activities').getError({ ...route, activities: [] }, {})).toEqual({
      name: 'activities',
      description: 'required field',
    });
  });

  it('is visible for its activities, and for rock climbing routes of the right kind', () => {
    const elevation = routeField('elevation_max');
    expect(elevation.isVisibleFor({ type: 'r', activities: ['hiking'] })).toBe(true);
    expect(elevation.isVisibleFor({ type: 'r', activities: ['paragliding'] })).toBe(false);

    const globalRating = routeField('global_rating');
    const rockClimbing = { type: 'r', activities: ['rock_climbing'] };
    expect(globalRating.isVisibleFor({ ...rockClimbing, climbing_outdoor_type: 'multi' })).toBe(true);
    expect(globalRating.isVisibleFor({ ...rockClimbing, climbing_outdoor_type: 'single' })).toBe(false);
    expect(globalRating.isVisibleFor({ type: 'r', activities: ['rock_climbing', 'mountain_climbing'] })).toBe(true);
  });
});
