// The outings written on the phone and not published yet, in IndexedDB: without a network, or kept on purpose
// ("Save without publishing"). Nothing goes out by itself: the user publishes them from "My topos"
// (src/stores/outing-queue.ts), which follows the rules below when the API refuses one.
import { get, set } from 'idb-keyval';

import type { C2cDocument } from '@/js/vue-plugins/document-utils';

// why an outing is no longer tried: the API answered 409 (a linked document changed meanwhile), refused it (400...),
// or it failed too many times
export type FreezeReason = 'conflict' | 'invalid' | 'exhausted';

export interface PendingOuting {
  id: string;
  queuedAt: number;
  // who wrote it (their user id): on a device shared by several people, the others neither see nor publish it
  owner: number | null;
  // the outing as the form gives it to the API
  payload: C2cDocument;
  title: string;
  attempts: number;
  // the last answer of the API, as the user can show it to someone
  lastError: string | null;
  // saved without a route, found back later from the note
  needsRouteAssoc: boolean;
  routeNote: string;
  // frozen: not tried again until the user decides
  conflict: boolean;
  freezeReason: FreezeReason | null;
  // the connection was lost while it was sent: it may be published already
  ambiguous: boolean;
}

const KEY = 'queue:pending-outings';

export const listPending = async () => (await get<PendingOuting[]>(KEY)) ?? [];

// one writer at a time, the other tabs of the app included: two of them changing the queue together would lose an
// outing. Without Web Locks (old browsers), in turn within the tab only
let chain: Promise<unknown> = Promise.resolve();
export function withQueue<T>(change: (queue: PendingOuting[]) => Promise<T> | T): Promise<T> {
  const run = () => listPending().then(change);
  if (navigator.locks?.request) {
    return navigator.locks.request('c2c-pending-outings', run) as Promise<T>;
  }
  const result = chain.then(run, run);
  chain = result.catch(() => {});
  return result;
}

export const writePending = (queue: PendingOuting[]) => set(KEY, queue);

export function newPending(payload: C2cDocument, title: string, owner: number | null, routeNote = ''): PendingOuting {
  return {
    id: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    queuedAt: Date.now(),
    owner,
    payload,
    title,
    attempts: 0,
    lastError: null,
    needsRouteAssoc: !!routeNote,
    routeNote,
    conflict: false,
    freezeReason: null,
    ambiguous: false,
  };
}

export const MAX_ATTEMPTS = 3;
// a session to renew, a server that answers later: worth trying again
const RETRYABLE = new Set([401, 403, 408, 429]);
// maintenance, overload: not the outing's fault, the attempt does not count
const UNAVAILABLE = new Set([429, 502, 503, 504]);

export const isServerUnavailable = (status?: number) => UNAVAILABLE.has(status ?? 0);

/**
 * What a failed publication does to the outing. status is undefined when no answer came back (network): then nobody
 * knows if the API created it, and publishing it again blindly could make a duplicate.
 */
export function classifyFailure(status: number | undefined, attempts: number, timedOut = false) {
  const attemptsAfter = attempts + 1;
  if (status === 409) {
    return { freeze: true, reason: 'conflict' as const, ambiguous: false, attemptsAfter };
  }
  if (isServerUnavailable(status)) {
    return { freeze: false, reason: null, ambiguous: false, attemptsAfter: attempts };
  }
  if (status !== undefined && status >= 400 && status < 500 && !RETRYABLE.has(status)) {
    return { freeze: true, reason: 'invalid' as const, ambiguous: false, attemptsAfter };
  }
  const ambiguous = status === undefined;
  // sent, then the network went: it may have arrived
  if (timedOut && ambiguous) {
    return { freeze: true, reason: 'exhausted' as const, ambiguous, attemptsAfter };
  }
  if (attemptsAfter >= MAX_ATTEMPTS) {
    return { freeze: true, reason: 'exhausted' as const, ambiguous, attemptsAfter };
  }
  return { freeze: false, reason: null, ambiguous, attemptsAfter };
}
