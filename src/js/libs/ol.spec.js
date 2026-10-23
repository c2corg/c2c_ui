import { describe, expect, it } from 'vitest';

import ol from './ol';

describe('ol', () => {
  it('exports the extent functions the stops layer of the maps uses', () => {
    expect(ol.extent.containsExtent([0, 0, 10, 10], [1, 1, 2, 2])).toBe(true);
    expect(ol.extent.containsExtent([0, 0, 10, 10], [5, 5, 20, 20])).toBe(false);
  });
});
