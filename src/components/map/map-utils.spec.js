import { describe, expect, it, vi } from 'vitest';

describe('map-utils', () => {
  it('can be imported before the font awesome icons are registered', async () => {
    // generic-components imports OlMap, hence this module, before main.js installs the font-awesome plugin
    vi.resetModules();

    await expect(import('./map-utils')).resolves.toHaveProperty('getDocumentPointStyle');
  });

  // no resetModules() here: map-utils, imported fresh by the test above, is reused instead of a second cold import
  // (slow imports: see testTimeout in vitest.config.mjs)
  it('draws document markers with the icons registered by the font-awesome plugin', async () => {
    const { getDocumentPointStyle } = await import('./map-utils');
    const { default: installFontAwesome } = await import('@/js/vue-plugins/font-awesome-config');
    installFontAwesome({ component: vi.fn() });

    const [circle, icon] = getDocumentPointStyle({ type: 'r', document_id: 1 }, 'title', false);

    expect(circle.getImage().getRadius()).toBe(15);
    expect(decodeURIComponent(icon.getImage().getSrc())).toMatch(
      /^data:image\/svg\+xml;charset=utf-8,<svg width="20px"/
    );
  }, 180000); // a cold import of all the Font Awesome icons: over a minute under the load of the full suite
});
