/**
 * OAuth relay for the activity trackers.
 *
 * The OAuth applications of the trackers (Strava, Polar...) only know the return URLs of the production site. A
 * pre-production or a preview of a pull request cannot be registered, so it sends the production URL as `redirect_uri`
 * and puts the page it wants to come back to in the OAuth `state` (RFC 6749, 4.1.1: opaque value returned unchanged).
 * The production page that receives the provider's answer then sends the browser on to that page, with the same query.
 *
 * Providers that do not return `state` are covered, for the pre-production, by a short-lived cookie shared with the
 * production site (same parent domain).
 *
 * The page to come back to must match a strict allow-list: anything else would let anybody receive the authorization
 * codes of the visitors.
 */

/** The only origin registered at the providers. */
export const PRODUCTION_ORIGIN = 'https://www.camptocamp.org';

const PREPROD_ORIGIN = 'https://www.preprod.camptocamp.org';
const PREVIEWS_ORIGIN = 'https://c2corg.github.io';
const PREVIEWS_PATH = '/c2c_ui/';

const COOKIE_NAME = 'c2c_trackers_return';
const COOKIE_DOMAIN = 'camptocamp.org';
const COOKIE_MAX_AGE_SECONDS = 15 * 60;

const RETURN_MARKER = ';return=';

/** Whether `value` is a page the production site may send the browser on to. */
export function isAllowedReturnUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    return false;
  }
  return url.origin === PREPROD_ORIGIN || (url.origin === PREVIEWS_ORIGIN && url.pathname.startsWith(PREVIEWS_PATH));
}

/** Whether pages of this origin use the relay (they cannot be registered at the providers). */
export function usesRelay(origin: string): boolean {
  return isAllowedReturnUrl(`${origin}${origin === PREVIEWS_ORIGIN ? PREVIEWS_PATH : '/'}`);
}

export type OAuthStart = {
  /** Origin to build the `redirect_uri` from. */
  origin: string;
  /** Whole `state` to send, if any. */
  state?: string;
};

/**
 * What to send to a provider.
 *
 * @param currentOrigin Origin of the current page
 * @param returnUrl Absolute URL of the current site's exchange-token page of the vendor
 * @param defaultState `state` the provider needs anyway (some require one)
 */
export function oauthStart(currentOrigin: string, returnUrl: string, defaultState?: string): OAuthStart {
  if (!usesRelay(currentOrigin)) {
    return { origin: currentOrigin, state: defaultState };
  }
  return { origin: PRODUCTION_ORIGIN, state: `${defaultState ?? ''}${RETURN_MARKER}${encodeURIComponent(returnUrl)}` };
}

/** Splits a `state` produced by {@link oauthStart}: the page to come back to, and the `state` the provider needed. */
function parseState(state: string | undefined): { returnUrl?: string; defaultState?: string } {
  const index = state?.indexOf(RETURN_MARKER) ?? -1;
  if (!state || index < 0) {
    return {};
  }
  try {
    return {
      returnUrl: decodeURIComponent(state.slice(index + RETURN_MARKER.length)),
      defaultState: state.slice(0, index) || undefined,
    };
  } catch {
    return {};
  }
}

/** Remembers where to come back to, for the providers that do not return `state`. */
export function rememberReturnUrl(hostname: string, returnUrl: string, doc: { cookie: string } = document): void {
  if (hostname.endsWith(`.${COOKIE_DOMAIN}`)) {
    doc.cookie = `${COOKIE_NAME}=${encodeURIComponent(returnUrl)}; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Secure; SameSite=Lax`;
  }
}

function readReturnCookie(cookies: string): string | undefined {
  const entry = cookies.split(';').find((part) => part.trim().startsWith(`${COOKIE_NAME}=`));
  if (!entry) {
    return undefined;
  }
  try {
    return decodeURIComponent(entry.trim().slice(COOKIE_NAME.length + 1));
  } catch {
    return undefined;
  }
}

/** Removes the cookie of {@link rememberReturnUrl}. */
export function forgetReturnUrl(doc: { cookie: string } = document): void {
  doc.cookie = `${COOKIE_NAME}=; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=0; Secure; SameSite=Lax`;
}

/**
 * Where to send the browser that comes back from a provider to the exchange-token page of `vendor`, or undefined to
 * handle the answer here.
 *
 * @param currentOrigin Origin of the current page: the answer is never sent on to the page it already is on
 */
export function relayTarget(
  vendor: string,
  query: Record<string, unknown>,
  cookies: string,
  currentOrigin: string
): string | undefined {
  const fromState = parseState(typeof query.state === 'string' ? query.state : undefined);
  const returnUrl = fromState.returnUrl ?? readReturnCookie(cookies);
  if (!returnUrl || !isAllowedReturnUrl(returnUrl)) {
    return undefined;
  }
  const target = new URL(returnUrl);
  // not the exchange-token page of that vendor
  if (
    target.origin === currentOrigin ||
    !`${target.pathname}${target.hash}`.endsWith(`/trackers/${vendor}/exchange-token`)
  ) {
    return undefined;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key !== 'state' && typeof value === 'string') {
      params.append(key, value);
    }
  }
  // the tracking service needs the `state` the provider required in the first place, not our extra part
  if (fromState.defaultState) {
    params.append('state', fromState.defaultState);
  } else if (fromState.returnUrl === undefined && typeof query.state === 'string') {
    params.append('state', query.state);
  }

  const search = params.toString();
  if (search) {
    if (target.hash.startsWith('#/')) {
      // hash router: the query belongs to the route
      target.hash = `${target.hash}?${search}`;
    } else {
      target.search = search;
    }
  }
  return target.href;
}
