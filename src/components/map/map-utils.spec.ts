import type Circle from 'ol/style/Circle';
import type Icon from 'ol/style/Icon';
import type Style from 'ol/style/Style';
import { describe, expect, it, vi } from 'vitest';

describe('map-utils', () => {
  it('can be imported before the font awesome icons are registered', async () => {
    // generic-components imports OlMap, hence this module, before main.ts installs the font-awesome plugin
    vi.resetModules();

    await expect(import('./map-utils')).resolves.toHaveProperty('getDocumentPointStyle');
  });

  // no resetModules() here: map-utils, imported fresh by the test above, is reused instead of a second cold import
  // (slow imports: see testTimeout in vitest.config.ts)
  it('draws document markers with the icons registered by the font-awesome plugin', async () => {
    const { getDocumentPointStyle } = await import('./map-utils');
    const { default: installFontAwesome } = await import('@/js/vue-plugins/font-awesome-config');
    installFontAwesome({ component: vi.fn() } as never);

    const [circle, icon] = getDocumentPointStyle({ type: 'r', document_id: 1 }, 'title', false) as Style[];

    expect((circle.getImage() as Circle).getRadius()).toBe(15);
    expect(decodeURIComponent((icon.getImage() as Icon).getSrc()!)).toMatch(
      /^data:image\/svg\+xml;charset=utf-8,<svg width="20px"/
    );
  }, 180000); // a cold import of all the Font Awesome icons: over a minute under the load of the full suite

  // the casing, then the line: [colour, width] of each
  const strokes = (styles: Style | Style[]) =>
    (styles as Style[]).map((style) => [style.getStroke()!.getColor(), style.getStroke()!.getWidth()]);

  it('draws the documents lines in yellow on a dark casing, in red and a little wider under the pointer', async () => {
    const { getDocumentLineStyle } = await import('./map-utils');

    expect(strokes(getDocumentLineStyle('title', false))).toEqual([
      ['#404040', 4.5],
      ['yellow', 2.5],
    ]);
    expect(strokes(getDocumentLineStyle('title', true))).toEqual([
      ['#404040', 5],
      ['red', 3],
    ]);
  });

  it('draws the public transport lines a little wider, on white also under the pointer', async () => {
    const { getDocumentLineStyle } = await import('./map-utils');
    const properties = { color: 'e2001a', name: 'Bus 1' };

    expect(strokes(getDocumentLineStyle('title', false, properties))).toEqual([
      ['white', 5.5],
      ['#e2001a', 3.5],
    ]);
    expect(strokes(getDocumentLineStyle('title', true, properties))).toEqual([
      ['white', 6],
      ['red', 4],
    ]);
    const walking = getDocumentLineStyle('title', false, { ...properties, isWalking: true }) as Style[];
    expect(walking.map((style) => style.getStroke()!.getLineDash())).toEqual([
      [8, 8],
      [8, 8],
    ]);
  });
});
