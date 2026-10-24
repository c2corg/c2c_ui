import { afterEach, describe, expect, it, vi } from 'vitest';

import transport from './transport-service';

const answer = (stopareas: object[]) => Promise.resolve({ data: { stopareas } });

describe('transport.getStopareasForDocuments', () => {
  afterEach(() => vi.restoreAllMocks());

  it('gathers the stops of each document, and tells which documents have none', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(transport.axios, 'get').mockImplementation((url: string) =>
      url.includes('/1/')
        ? answer([{ name: 'Gare', distance: 120 }, { name: 'Place' }])
        : url.includes('/2/')
          ? answer([])
          : Promise.reject(new Error('Network Error'))
    );

    const result = await transport.getStopareasForDocuments([
      { document_id: 1 },
      { document_id: 2 },
      { document_id: 3 },
    ]);

    expect(result.stopareas).toEqual([
      { name: 'Gare', distance: 120, document_id: 1 },
      { name: 'Place', distance: 0, document_id: 1 },
    ]);
    expect(result.documentResults).toEqual({ 1: true, 2: false, 3: false });
    expect(result.missingTransportForWaypoint).toBe(true);
  });

  it('answers at once without documents', async () => {
    const get = vi.spyOn(transport.axios, 'get');

    await expect(transport.getStopareasForDocuments([])).resolves.toEqual({
      stopareas: [],
      missingTransportForWaypoint: false,
      documentResults: {},
    });
    expect(get).not.toHaveBeenCalled();
  });
});
