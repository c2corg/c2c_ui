import { describe, expect, it } from 'vitest';

import { computeQuality, getOutingQuality } from './document-quality';

import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const outing = (activities: string[], attributes: object = {}) =>
  ({
    type: 'o',
    quality: 'draft',
    activities,
    associations: { waypoints: [], routes: [], images: [] },
    ...attributes,
  }) as C2cDocument;

const track = { geometry: { geom: null, geom_detail: '{"type":"LineString","coordinates":[[0,0],[1,1]]}' } };
const images = { associations: { waypoints: [], routes: [], images: [{ document_id: 1 }] } };

describe('getOutingQuality', () => {
  it('is empty without anything written', () => {
    expect(getOutingQuality(outing(['rock_climbing']), {})).toBe('empty');
    expect(getOutingQuality(outing(['rock_climbing']), { description: '  \n ' })).toBe('empty');
  });

  it('is never empty with a text, even a short one, for every activity', () => {
    for (const activity of ['skitouring', 'mountain_climbing', 'rock_climbing', 'hiking', 'paragliding']) {
      for (const field of ['route_description', 'access_comment', 'timing', 'weather']) {
        expect(getOutingQuality(outing([activity]), { [field]: 'plan an Abalakov' })).toBe('draft');
      }
    }
  });

  it('counts the track and the images', () => {
    const locale = { route_description: 'the left variant' };
    // route description 0.5
    expect(getOutingQuality(outing(['rock_climbing']), locale)).toBe('draft');
    // with the track and images: 1.5, still without the key information
    expect(getOutingQuality(outing(['rock_climbing'], { ...track, ...images }), locale)).toBe('draft');
    // a personal comment: 2.5
    expect(
      getOutingQuality(outing(['rock_climbing'], { ...track, ...images }), { ...locale, description: 'abrasive rock' })
    ).toBe('medium');
  });

  it('takes the personal comment of a rock climbing outing as its key information', () => {
    // a detailed outing, with its information in the personal comment and photos (no conditions, weather, timing)
    const detailed = { route_description: 'approach and pitches', description: 'equipment, rock, descent' };
    expect(getOutingQuality(outing(['rock_climbing'], images), detailed)).toBe('medium');

    // a few words on the weather and the timing are not more than that
    const weatherOnly = { conditions: 'not too hot', weather: 'sunny, a few cumulus', timing: '5h' };
    expect(getOutingQuality(outing(['rock_climbing']), weatherOnly)).toBe('medium');

    // both
    expect(getOutingQuality(outing(['rock_climbing'], images), { ...detailed, ...weatherOnly })).toBe('fine');
  });

  it('caps the outings without their key information at medium', () => {
    const locale = { route_description: 'route', description: 'comment', weather: 'sunny', timing: '5h' };
    // mountaineering: the conditions
    expect(getOutingQuality(outing(['mountain_climbing'], { ...track, ...images }), locale)).toBe('medium');
    expect(getOutingQuality(outing(['mountain_climbing'], track), { ...locale, conditions: 'icy couloir' })).toBe(
      'fine'
    );

    // ski: the snow conditions
    const ski = outing(['skitouring'], { ...track, ...images, snow_quality: 'good', condition_rating: 'good' });
    expect(getOutingQuality(ski, locale)).toBe('medium');
    expect(getOutingQuality(ski, { ...locale, conditions: 'powder above 2000 m' })).toBe('fine');
  });

  it('takes the weather of a paragliding outing as its key information', () => {
    const locale = { route_description: 'from the summit', timing: '1h' };
    expect(getOutingQuality(outing(['paragliding'], track), { ...locale, weather: 'north wind, 15 km/h' })).toBe(
      'medium'
    );
    expect(
      getOutingQuality(outing(['paragliding'], { ...track, ...images }), { ...locale, weather: 'north wind, 15 km/h' })
    ).toBe('fine');
  });

  it('takes the best of the activities of the outing', () => {
    const locale = { route_description: 'route', description: 'equipment, rock', timing: '5h', weather: 'sunny' };
    // the rock climbing does not need the conditions, the mountaineering does
    expect(getOutingQuality(outing(['mountain_climbing'], images), locale)).toBe('medium');
    expect(getOutingQuality(outing(['mountain_climbing', 'rock_climbing'], images), locale)).toBe('fine');
  });
});

describe('computeQuality', () => {
  it('keeps a great quality, and the quality of the other documents', () => {
    expect(computeQuality(outing(['rock_climbing'], { quality: 'great' }), {})).toBe('great');
    expect(computeQuality({ type: 'r', quality: 'fine' } as C2cDocument, {})).toBe('fine');
  });
});
