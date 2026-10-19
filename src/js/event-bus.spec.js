import { afterEach, describe, expect, it, vi } from 'vitest';

import bus, { once } from './event-bus';

describe('event-bus', () => {
  afterEach(() => bus.all.clear());

  it('calls the handlers of an event with its payload', () => {
    const handler = vi.fn();
    bus.on('elevation_profile', handler);

    bus.emit('elevation_profile', { action: 'cursor_move', coord: [1, 2] });

    expect(handler).toHaveBeenCalledWith({ action: 'cursor_move', coord: [1, 2] });
  });

  it('stops calling a handler once it is removed, and only that one', () => {
    const removed = vi.fn();
    const kept = vi.fn();
    bus.on('show-gdpr', removed);
    bus.on('show-gdpr', kept);

    bus.off('show-gdpr', removed);
    bus.emit('show-gdpr');

    expect(removed).not.toHaveBeenCalled();
    expect(kept).toHaveBeenCalledTimes(1);
  });

  it('calls a once() handler on the next event only', () => {
    const handler = vi.fn();
    once('trigger-scroll', handler);

    bus.emit('trigger-scroll');
    bus.emit('trigger-scroll');

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call a once() handler removed before the event', () => {
    const handler = vi.fn();
    const off = once('trigger-scroll', handler);

    off();
    bus.emit('trigger-scroll');

    expect(handler).not.toHaveBeenCalled();
    expect(bus.all.get('trigger-scroll')).toEqual([]);
  });
});
