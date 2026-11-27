// The daily reminder of the offline topos to download again
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { remind, shouldRemind } from './offline-reminder';

const notify = vi.hoisted(() => vi.fn());
vi.mock('@/js/toast', () => ({ notify }));

const MORNING = new Date('2026-11-20T07:00:00Z');
const EVENING = new Date('2026-11-20T19:00:00Z');
const NEXT_DAY = new Date('2026-11-21T07:00:00Z');

describe('offline reminder', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => notify.mockReset());

  it('reminds online, when a topo needs it, once a day', () => {
    expect(shouldRemind(0, true, MORNING)).toBe(false);
    expect(shouldRemind(2, false, MORNING)).toBe(false);
    expect(shouldRemind(2, true, MORNING)).toBe(true);

    remind('Offline topos to check: 2.', 'My topos', () => {}, MORNING);
    expect(shouldRemind(2, true, EVENING)).toBe(false);
    expect(shouldRemind(2, true, NEXT_DAY)).toBe(true);
  });

  it('shows a toast whose button opens My topos', () => {
    const open = vi.fn();
    remind('Offline topos to check: 2.', 'My topos', open, MORNING);

    expect(notify).toHaveBeenCalledWith(expect.any(HTMLElement), 'is-warning', expect.anything());
    const message = notify.mock.calls[0][0] as HTMLElement;
    expect(message.textContent).toContain('Offline topos to check: 2.');
    message.querySelector('button')!.click();
    expect(open).toHaveBeenCalledTimes(1);
  });
});
