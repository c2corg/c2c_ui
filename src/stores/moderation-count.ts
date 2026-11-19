// The removal requests the signed in moderator can validate now (`actionable` of GET /users/removals/count): the pill
// of the moderation entries of the menus. Asked at most every 5 minutes, the answer kept in the session storage so
// that reloads and other tabs reuse it; asked again at once after an action on the requests.
import { ref } from 'vue';

import c2c from '@/js/apis/c2c';

export const CACHE_KEY = 'moderation.actionable';
export const CACHE_TTL = 5 * 60 * 1000;

export const actionableCount = ref(0);

let pending: Promise<void> | null = null;
let pendingUser: number | null = null;

type Cached = { user: number; at: number; actionable: number };

function readCache(user: number): Cached | null {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null') as Cached | null;
    return cached && cached.user === user ? cached : null;
  } catch {
    return null;
  }
}

function writeCache(value: Cached) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // no storage (private window): asked again on each page load only
  }
}

/** Reads the count of the user, from the cache while it is fresh, unless forced. */
export function refreshModerationCount(user: number, force = false): Promise<void> {
  const cached = readCache(user);
  if (!force && cached && Date.now() - cached.at < CACHE_TTL) {
    actionableCount.value = cached.actionable;
    return Promise.resolve();
  }
  if (pending && pendingUser === user && !force) {
    return pending;
  }
  pendingUser = user;
  const request = new Promise<void>((resolve) => {
    c2c.moderator.countAccountRemovals().then(
      (response) => {
        // an API without `actionable` (before v6_api#2669): no pill
        const actionable = response.data.actionable ?? 0;
        writeCache({ user, at: Date.now(), actionable });
        if (pendingUser === user) {
          actionableCount.value = actionable;
        }
        resolve();
      },
      // a forum which does not answer, a role lost: no pill, asked again later
      () => resolve()
    );
  }).finally(() => {
    pending = null;
  });
  pending = request;
  return request;
}

/** Signed out, or not a moderator anymore. */
export function clearModerationCount() {
  pendingUser = null;
  actionableCount.value = 0;
}
