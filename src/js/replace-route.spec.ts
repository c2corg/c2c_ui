import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import { replaceRoute } from './replace-route';

const makeRouter = async (path: string) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/routes/:id/:lang?/:title?', name: 'route', component: { render: () => null } },
      { path: '/outings/:id', name: 'outing', component: { render: () => null } },
    ],
  });
  await router.push(path);
  return router;
};

describe('replaceRoute', () => {
  it('replaces the route, with no retry', async () => {
    const router = await makeRouter('/routes/1/fr');
    const retry = vi.fn();
    await replaceRoute(router, { query: { layer: 'ign' } }, retry);
    await flushPromises();

    expect(router.currentRoute.value.fullPath).toBe('/routes/1/fr?layer=ign');
    expect(retry).not.toHaveBeenCalled();
  });

  it('retries once the navigation that cancelled it is over, on the same page', async () => {
    const router = await makeRouter('/routes/1/fr');
    const retry = vi.fn(() => replaceRoute(router, { query: { layer: 'ign' } }, retry));
    // the map writes its settings, then the document view the title, before the first one is over
    const map = replaceRoute(router, { query: { layer: 'ign' } }, retry);
    const title = router.replace({ path: '/routes/1/fr/the-title' });
    await Promise.all([map, title]);
    await flushPromises();

    expect(retry).toHaveBeenCalledTimes(1);
    expect(router.currentRoute.value.fullPath).toBe('/routes/1/fr/the-title?layer=ign');
  });

  it('does not retry when the user went to another page meanwhile', async () => {
    const router = await makeRouter('/routes/1/fr');
    const retry = vi.fn();
    const map = replaceRoute(router, { query: { layer: 'ign' } }, retry);
    const other = router.push('/outings/2');
    await Promise.all([map, other]);
    await flushPromises();

    expect(retry).not.toHaveBeenCalled();
    expect(router.currentRoute.value.fullPath).toBe('/outings/2');
  });
});
