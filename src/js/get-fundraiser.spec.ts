import { describe, expect, it } from 'vitest';

import getFundraiser from './get-fundraiser';

// Buoux: a climbing site with a fundraiser (its document, as a waypoint, or as the main waypoint of a route)
const BUOUX = 102357;
const buoux = { type: 'w', document_id: BUOUX, waypoint_type: 'climbing_outdoor', equipment_ratings: ['P1'] };
const route = (properties = {}) => ({
  type: 'r',
  document_id: 1,
  activities: ['rock_climbing'],
  equipment_rating: 'P1',
  main_waypoint_id: BUOUX,
  associations: { waypoints: [{ document_id: BUOUX }] },
  ...properties,
});

describe('getFundraiser', () => {
  it('gives the fundraiser of a well bolted climbing site, or of the main waypoint of its routes', () => {
    expect(getFundraiser(buoux)?.url).toContain('buoux');
    expect(getFundraiser(route())?.url).toContain('buoux');
  });

  it('gives no fundraiser to other documents', () => {
    expect(getFundraiser({ ...buoux, waypoint_type: 'summit' })).toBeNull();
    expect(getFundraiser({ ...buoux, equipment_ratings: ['P3'] })).toBeNull();
    expect(getFundraiser(route({ activities: ['skitouring'] }))).toBeNull();
    expect(getFundraiser(route({ equipment_rating: 'P2' }))).toBeNull();
    expect(getFundraiser({ type: 'o', document_id: BUOUX })).toBeNull();
    expect(getFundraiser(route({ main_waypoint_id: 2, associations: { waypoints: [] } }))).toBeNull();
  });

  it('looks for the fundraiser of the areas, the most precise first', () => {
    const areas = [
      { document_id: 14137, area_type: 'country' },
      { document_id: 3, area_type: 'range' },
    ];
    expect(getFundraiser(route({ main_waypoint_id: 2, associations: { waypoints: [] }, areas }))?.url).toContain(
      'alpineclub.org.nz'
    );
  });
});
