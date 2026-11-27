import { describe, expect, it } from 'vitest';
import type { RouteLocationNormalized, RouterScrollBehavior } from 'vue-router';

import router from './router';

import bus from '@/js/event-bus';

// what the scroll behavior gives: a position, false or nothing
type ScrollResult = Awaited<ReturnType<RouterScrollBehavior>>;

const scrollBehavior = router.options.scrollBehavior!;
const route = (hash = '', query = {}, path = '/routes/1') => ({ hash, query, path }) as RouteLocationNormalized;
// the saved position, given back once the view triggers the scroll
const savedPosition = (top: number) => scrollBehavior(route(), route(), { left: 0, top }) as Promise<ScrollResult>;

describe('router scroll behavior', () => {
  it('scrolls to the top of a new page at once', () => {
    expect(scrollBehavior(route(), route(), null)).toEqual({ left: 0, top: 0 });
  });

  it('keeps the position when the map writes its settings in the URL, or a list its view', () => {
    expect(scrollBehavior(route('', { act: 'hiking', view: 'map' }), route('', { act: 'hiking' }), null)).toBe(false);
    expect(scrollBehavior(route('', { layer: 'esri' }), route(), null)).toBe(false);
    expect(scrollBehavior(route('', { slopes: 'ign' }), route('', { slopes: 'ign,swiss' }), null)).toBe(false);
    expect(scrollBehavior(route('', { bbox: '1,2,3,4' }), route('', { bbox: '1,2,3,4', pin: 'left' }), null)).toBe(
      false
    );
  });

  it('restores the saved position at once, back or forward between map settings of the same page', () => {
    const saved = { left: 0, top: 200 };
    expect(scrollBehavior(route('', { layer: 'esri' }), route(), saved)).toEqual(saved);
    // nothing left waiting for the view to trigger the scroll
    expect(bus.all.get('trigger-scroll') ?? []).toEqual([]);
  });

  it('scrolls to the top when other parameters change, as a new page of a list', () => {
    expect(scrollBehavior(route('', { offset: '30' }), route(), null)).toEqual({ left: 0, top: 0 });
    expect(scrollBehavior(route('', { offset: '30', layer: 'esri' }), route(), null)).toEqual({ left: 0, top: 0 });
    expect(scrollBehavior(route('', { layer: 'esri' }), route('', {}, '/routes/2'), null)).toEqual({ left: 0, top: 0 });
  });

  it('scrolls to the top of the same page navigated to again', () => {
    expect(scrollBehavior(route(), route(), null)).toEqual({ left: 0, top: 0 });
  });

  it('lets the document view handle anchors', () => {
    expect(scrollBehavior(route('#gear'), route(), null)).toBe(false);
  });

  it('restores the saved position once the view has its data (trigger-scroll)', async () => {
    let resolved: ScrollResult | null = null;
    savedPosition(1200).then((position) => (resolved = position));

    await Promise.resolve();
    expect(resolved).toBe(null);

    bus.emit('trigger-scroll');
    await Promise.resolve();
    expect(resolved).toEqual({ left: 0, top: 1200 });
    expect(bus.all.get('trigger-scroll')).toEqual([]);
  });

  it('does not give the saved position to the next page when the previous one never triggered the scroll', async () => {
    let resolved: ScrollResult | null = null;
    savedPosition(1200).then((position) => (resolved = position));

    // the user leaves before the view triggers the scroll, for a new page
    expect(scrollBehavior(route(), route(), null)).toEqual({ left: 0, top: 0 });

    // the new page has its data
    bus.emit('trigger-scroll');
    await Promise.resolve();
    expect(resolved).toBe(null);
    expect(bus.all.get('trigger-scroll')).toEqual([]);
  });

  it('restores the position of the last page when several are waiting', async () => {
    const resolved: ScrollResult[] = [];
    savedPosition(1200).then((position) => resolved.push(position));
    savedPosition(300).then((position) => resolved.push(position));

    bus.emit('trigger-scroll');
    await Promise.resolve();
    expect(resolved).toEqual([{ left: 0, top: 300 }]);
  });
});

describe('the paths of the topographic maps', () => {
  it('are /papermaps, /map being the map of the site; the former /maps paths lead there', () => {
    expect(router.resolve({ name: 'map', params: { id: 1, lang: 'fr' } }).path).toBe('/papermaps/1/fr');
    expect(router.resolve('/map').name).toBe('waypoints-map');
    const redirect = router.getRoutes().find((record) => record.path.startsWith('/maps'))!.redirect as (
      to: RouteLocationNormalized
    ) => string;
    expect(redirect(router.resolve('/maps/12/fr/a-title?x=1#h') as RouteLocationNormalized)).toBe(
      '/papermaps/12/fr/a-title?x=1#h'
    );
  });
});
