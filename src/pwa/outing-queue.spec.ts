import 'fake-indexeddb/auto';
import { clear } from 'idb-keyval';
import { beforeEach, describe, expect, it } from 'vitest';

import { classifyFailure, listPending, MAX_ATTEMPTS, newPending, withQueue, writePending } from './outing-queue';

describe('a failed publication', () => {
  it('freezes a conflict and a refusal at once, for the user to decide', () => {
    expect(classifyFailure(409, 0)).toMatchObject({ freeze: true, reason: 'conflict', ambiguous: false });
    expect(classifyFailure(400, 0)).toMatchObject({ freeze: true, reason: 'invalid' });
    expect(classifyFailure(405, 0)).toMatchObject({ freeze: true, reason: 'invalid' });
  });

  it('does not count an unavailable server against the outing', () => {
    expect(classifyFailure(503, 2)).toMatchObject({ freeze: false, attemptsAfter: 2 });
    expect(classifyFailure(429, 2)).toMatchObject({ freeze: false, attemptsAfter: 2 });
  });

  it('tries a session or a timeout again, up to the limit', () => {
    expect(classifyFailure(401, 0)).toMatchObject({ freeze: false, attemptsAfter: 1 });
    expect(classifyFailure(401, MAX_ATTEMPTS - 1)).toMatchObject({
      freeze: true,
      reason: 'exhausted',
      ambiguous: false,
    });
  });

  it('says when nobody knows whether the outing arrived', () => {
    // no answer: it may have been created
    expect(classifyFailure(undefined, 0)).toMatchObject({ freeze: false, ambiguous: true });
    // sent, then the connection timed out: not tried again blindly
    expect(classifyFailure(undefined, 0, true)).toMatchObject({ freeze: true, reason: 'exhausted', ambiguous: true });
  });
});

describe('the queue on the phone', () => {
  beforeEach(() => clear());

  it('keeps the outings, and its writers one at a time', async () => {
    const outing = { type: 'o', locales: [{ lang: 'fr', title: 'Dent du Requin' }] };
    // two changes started together: neither loses the other's outing
    await Promise.all([
      withQueue((queue) => writePending([...queue, newPending(outing, 'one', 42)])),
      withQueue((queue) => writePending([...queue, newPending(outing, 'two', 42, 'face sud')])),
    ]);
    const queue = await listPending();
    expect(queue.map((item) => item.title)).toEqual(['one', 'two']);
    expect(queue[0]).toMatchObject({ attempts: 0, needsRouteAssoc: false, conflict: false });
    expect(queue[1]).toMatchObject({ needsRouteAssoc: true, routeNote: 'face sud' });
  });
});
