import { describe, expect, it } from 'vitest';

import { getGearArticles } from './gear-articles';

const articles = (route: object) => getGearArticles(route, (text) => text);

describe('getGearArticles', () => {
  it('gives the articles of the activities and ratings of the route', () => {
    expect(articles({ activities: ['skitouring'] })).toEqual({ '183333': 'Skitouring gear' });
    expect(articles({ activities: ['rock_climbing'], equipment_rating: 'P1' })).toEqual({
      '183332': 'Bolted rock climbing gear',
    });
    expect(articles({ activities: ['rock_climbing'], climbing_outdoor_type: 'bloc' })).toEqual({
      '1516488': 'Bouldering climbing gear',
    });
    expect(articles({ activities: ['hiking', 'ice_climbing'] })).toEqual({
      '185207': 'Hiking gear',
      '194479': 'Ice and dry climbing gear',
    });
  });

  it('gives the glacier gear article for the glacier activities only', () => {
    expect(
      articles({ activities: ['mountain_climbing'], global_rating: 'D', glacier_gear: 'glacier_crampons' })
    ).toEqual({ '185750': 'Easy snow ice mixed gear' });
    expect(articles({ activities: ['hiking'], glacier_gear: 'glacier_crampons' })).toEqual({ '185207': 'Hiking gear' });
    expect(articles({ activities: ['mountain_climbing'], global_rating: 'D', glacier_gear: 'no' })).toEqual({});
  });

  it('gives nothing for a route without activities', () => {
    expect(articles({})).toEqual({});
  });
});
