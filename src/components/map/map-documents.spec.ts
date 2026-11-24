import { describe, expect, it } from 'vitest';

import { documentLayers } from './map-documents';

describe('documentLayers', () => {
  it('draws the highlighted points last, out of the layers of their group', () => {
    const { documents, waypoints } = documentLayers('documents');
    const ids = [...documents, ...waypoints].map((layer) => layer.id);

    // the icon of a neighbour, in the icon layer of its group, would be drawn on the circle of the highlighted point
    expect(ids.slice(-2)).toEqual(['highlighted-circle', 'highlighted-icon']);
    const filterOf = (id: string) =>
      JSON.stringify((waypoints.find((layer) => layer.id === id) as { filter: unknown }).filter);
    expect(filterOf('waypoints-circle')).toContain('["!",["has","highlight"]]');
    expect(filterOf('highlighted-icon')).toContain('["has","highlight"]');
    expect(filterOf('highlighted-icon')).not.toContain('"group"');
  });
});
