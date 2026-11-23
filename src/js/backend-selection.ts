/**
 * Backend of the builds where it is selectable (dev server, GitHub Pages previews), by precedence:
 *
 * 1. `?backend=<name>` in the URL: kept in the sessionStorage of the tab, for its next pages and reloads;
 * 2. The backend chosen earlier in this tab (sessionStorage);
 * 3. The default of the build (`config.urls`): C2C_BACKEND when the dev server starts or the build runs, else prod.
 *
 * The choice belongs to one tab: the other tabs don't see it. The GitHub Pages previews share one origin, so the ones
 * opened in the same tab share the choice (when their build knows that backend).
 */

export const BACKEND_PARAM = 'backend';
export const BACKEND_SESSION_KEY = 'SiteConfiguration.backend';
// the choice used to be kept for the whole origin
export const LEGACY_BACKEND_LOCAL_STORAGE_KEY = 'SiteConfiguration.urlsName';

type SessionStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function selectBackend(config: BuildConfiguration, search: string, session: SessionStore): string {
  const isKnown = (name: string) => {
    // own names only: `?backend=constructor` is not a backend
    if (Object.hasOwn(config.urlsConfigurations, name)) {
      return true;
    }
    console.warn(`Unknown backend "${name}", ignored`);
    return false;
  };

  const fromUrl = new URLSearchParams(search).get(BACKEND_PARAM);
  if (fromUrl && isKnown(fromUrl)) {
    try {
      session.setItem(BACKEND_SESSION_KEY, fromUrl);
    } catch (error) {
      // storage full or denied: the choice still applies to this page
      console.warn('Cannot keep the backend choice in this tab', error);
    }
    return fromUrl;
  }

  const fromSession = session.getItem(BACKEND_SESSION_KEY);
  if (fromSession) {
    if (isKnown(fromSession)) {
      return fromSession;
    }
    session.removeItem(BACKEND_SESSION_KEY);
  }

  return config.urls.name;
}

/** The current page on another backend: `?backend=` wins over the choice kept in the tab */
export function urlWithBackend(href: string, name: string): string {
  const url = new URL(href);
  url.searchParams.set(BACKEND_PARAM, name);
  return url.toString();
}
