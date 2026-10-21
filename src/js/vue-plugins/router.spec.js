import { describe, expect, it } from 'vitest';

import router from './router';

import bus from '@/js/event-bus';

const { scrollBehavior } = router.options;
const route = (hash = '') => ({ hash });

describe('router scroll behavior', () => {
  it('scrolls to the top of a new page at once', () => {
    expect(scrollBehavior(route(), route(), null)).toEqual({ left: 0, top: 0 });
  });

  it('lets the document view handle anchors', () => {
    expect(scrollBehavior(route('#gear'), route(), null)).toBe(false);
  });

  it('restores the saved position once the view has its data (trigger-scroll)', async () => {
    let resolved = null;
    scrollBehavior(route(), route(), { left: 0, top: 1200 }).then((position) => (resolved = position));

    await Promise.resolve();
    expect(resolved).toBe(null);

    bus.emit('trigger-scroll');
    await Promise.resolve();
    expect(resolved).toEqual({ left: 0, top: 1200 });
    expect(bus.all.get('trigger-scroll')).toEqual([]);
  });

  it('does not give the saved position to the next page when the previous one never triggered the scroll', async () => {
    let resolved = null;
    scrollBehavior(route(), route(), { left: 0, top: 1200 }).then((position) => (resolved = position));

    // the user leaves before the view triggers the scroll, for a new page
    expect(scrollBehavior(route(), route(), null)).toEqual({ left: 0, top: 0 });

    // the new page has its data
    bus.emit('trigger-scroll');
    await Promise.resolve();
    expect(resolved).toBe(null);
    expect(bus.all.get('trigger-scroll')).toEqual([]);
  });

  it('restores the position of the last page when several are waiting', async () => {
    const resolved = [];
    scrollBehavior(route(), route(), { left: 0, top: 1200 }).then((position) => resolved.push(position));
    scrollBehavior(route(), route(), { left: 0, top: 300 }).then((position) => resolved.push(position));

    bus.emit('trigger-scroll');
    await Promise.resolve();
    expect(resolved).toEqual([{ left: 0, top: 300 }]);
  });
});
