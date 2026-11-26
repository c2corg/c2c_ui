import { describe, expect, it } from 'vitest';

import { prefillFromQuery, trackFromHash } from './prefill-from-query';

import constants from '@/js/constants';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const fields = constants.objectDefinitions.outing.fields;

function prefilled(query: Record<string, string | string[]>) {
  const document: C2cDocument = { type: 'o', locales: [{ lang: 'fr' }] };
  prefillFromQuery(document, fields, query);
  return document;
}

describe('prefillFromQuery', () => {
  it('fills the fields of the document and of its locale', () => {
    const document = prefilled({
      date_start: '2026-11-26',
      height_diff_up: '930',
      elevation_max: '3281',
      condition_rating: 'good',
      avalanche_signs: 'no,danger_sign',
      partial_trip: 'true',
      title: 'Pointe de la Galise',
      timing: 'Départ 7 h',
    });

    expect(document).toMatchObject({
      date_start: '2026-11-26',
      height_diff_up: 930,
      elevation_max: 3281,
      condition_rating: 'good',
      avalanche_signs: ['no', 'danger_sign'],
      partial_trip: true,
      locales: [{ lang: 'fr', title: 'Pointe de la Galise', timing: 'Départ 7 h' }],
    });
  });

  it('ignores a value that does not fit its field', () => {
    const document = prefilled({
      date_start: '26/11/2026',
      height_diff_up: '12000',
      elevation_max: 'high',
      condition_rating: 'superb',
      avalanche_signs: 'no,unknown_sign',
      partial_trip: 'yes',
    });

    expect(document).toEqual({ type: 'o', locales: [{ lang: 'fr' }] });
  });

  it('leaves alone what other parameters give, and what is not a field', () => {
    const document = prefilled({ lang: 'en', r: '1000819', geom: '{}', routes: '1000819', has_track: 'true' });

    expect(document).toEqual({ type: 'o', locales: [{ lang: 'fr' }] });
  });

  it('keeps the first value of a parameter given twice, and skips an empty one', () => {
    const document = prefilled({ height_diff_up: ['930', '1200'], title: '' });

    expect(document.height_diff_up).toBe(930);
    expect(document.locales![0].title).toBeUndefined();
  });
});

describe('trackFromHash', () => {
  it('reads the track of the fragment, percent-decoded', () => {
    const track = JSON.stringify({ type: 'LineString', coordinates: [[5.63244, 45.16515, 1277, 1792825200]] });

    expect(trackFromHash(`#geom=${encodeURIComponent(track)}`)).toBe(track);
  });

  it('keeps a GPX whose times carry a "+"', () => {
    const gpx =
      '<gpx><trk><trkseg><trkpt lat="45.1" lon="5.6"><time>2026-10-24T09:00:00+02:00</time></trkpt></trkseg></trk></gpx>';

    expect(trackFromHash(`#geom=${encodeURIComponent(gpx)}`)).toBe(gpx);
  });

  it('gives null without a track', () => {
    expect(trackFromHash('')).toBeNull();
    expect(trackFromHash('#geom=')).toBeNull();
    expect(trackFromHash('#description')).toBeNull();
  });
});
