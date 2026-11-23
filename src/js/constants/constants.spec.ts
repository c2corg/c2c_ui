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

describe('has_track', () => {
  it('is a yes/no filter of the outings and routes lists, not an attribute of the documents', () => {
    for (const type of ['outing', 'route']) {
      expect(constants.objectDefinitions[type].fields.has_track).toMatchObject({
        parent: 'query',
        url: 'trk',
        queryMode: 'tristate',
        label: 'GPS Track',
        defaultUrlQuery: '',
      });
    }
    expect(constants.objectDefinitions.waypoint.fields.has_track).toBeUndefined();
    expect(routeField('has_track').nullable).toBeFalsy();
    expect(constants.categorizedFieldsDefault.Miscs).toContain('has_track');
  });

  it('has no "no info" choice, and no error in a document', () => {
    const hasTrack = routeField('has_track');
    expect(['true', 'false', 'null'].map((url) => hasTrack.urlToValue(url))).toEqual(['yes', 'no', undefined]);
    expect(hasTrack.getError({ type: 'r' }, {})).toBeNull();
  });

  it('does not come in a new document', () => {
    // buildDocument() gives a value to every field of the document
    const fields = Object.values(constants.objectDefinitions.outing.fields);
    expect(fields.filter((field) => field.parent === 'document').map((field) => field.name)).not.toContain('has_track');
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

  it('checks the range of the numbers, with a higher max for a multi-day outing or route', () => {
    const outingField = (name: string) => constants.objectDefinitions.outing.fields[name];
    const heightDiff = outingField('height_diff_up');
    const day = { type: 'o', activities: ['hiking'], date_start: '2026-07-24', date_end: '2026-07-24' };
    const trek = { ...day, date_end: '2026-08-20' };

    expect(heightDiff.getError({ ...day, height_diff_up: 9000 }, {})).toBeNull();
    expect(heightDiff.getError({ ...day, height_diff_up: 35000 }, {})).toEqual({
      name: 'height_diff_up',
      description: 'Greater than maximum value',
      limit: 9000,
    });
    expect(heightDiff.getError({ ...day, height_diff_up: -1 }, {})).toEqual({
      name: 'height_diff_up',
      description: 'Less than minimum value',
      limit: 0,
    });
    expect(heightDiff.maxFor(trek)).toBe(32767);
    expect(heightDiff.getError({ ...trek, height_diff_up: 30000 }, {})).toBeNull();
    expect(heightDiff.getError({ ...trek, height_diff_up: 35000 }, {})).toMatchObject({ limit: 32767 });

    // a route of several days
    const routeHeightDiff = routeField('height_diff_down');
    const route = { type: 'r', activities: ['hiking'], height_diff_down: 12000 };
    expect(routeHeightDiff.getError({ ...route, durations: ['1'] }, {})).toMatchObject({ limit: 9000 });
    expect(routeHeightDiff.getError({ ...route, durations: ['10+'] }, {})).toBeNull();

    // a field without multi-day max, and an empty value
    expect(outingField('elevation_max').maxFor(trek)).toBe(9000);
    expect(heightDiff.getError({ ...day, height_diff_up: null }, {})).toBeNull();
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
