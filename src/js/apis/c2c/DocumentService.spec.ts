import { afterEach, describe, expect, it, vi } from 'vitest';

import routeCooked from './fixtures/route-cooked.json';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';

const answer = (data: unknown) => vi.spyOn(c2c.axios, 'get').mockResolvedValue({ data, status: 200 });
const routes = c2c.route as DocumentService;

describe('DocumentService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('checks a document with the schema of its type', async () => {
    answer(routeCooked);
    await expect(routes.getCooked(routeCooked.document_id, 'fr')).resolves.toMatchObject({ data: routeCooked });

    // an unknown activity: an error in the tests (and in development), a report in production
    answer({ ...routeCooked, activities: ['surfing'] });
    await expect(routes.getCooked(routeCooked.document_id, 'fr')).rejects.toThrow('Unexpected response to GET');
  });

  it('accepts a merged document, which only gives the one it was merged into', async () => {
    const merged = { redirects_to: 12, available_langs: ['fr'] };
    answer(merged);

    await expect(routes.get(11)).resolves.toMatchObject({ data: merged });
    await expect(routes.getCooked(11, 'fr')).resolves.toMatchObject({ data: merged });
  });
});
