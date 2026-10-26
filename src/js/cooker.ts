/*
 * This Object is a a wrapper around API /cooker service
 *
 *It use a cache object to store calculated field, in order to preserve API
 *It also prevent the computation of not markdown property
 */

import Cache from './Cache';

import c2c from '@/js/apis/c2c';

const NOT_MARKDOWN_PROPERTY = new Set([
  'lang',
  'version',
  'title',
  'slope',
  'conditions_levels',
  'topic_id',
  'participants',
]);

// a locale, its markdown properties raw or cooked (HTML)
type Locale = Record<string, unknown>;

type CookedResponse = { data: Locale };

class Cooker {
  _cache = new Cache();

  has(markdown: string) {
    return this._cache.has(markdown);
  }

  get(markdown: string) {
    return this._cache.get(markdown);
  }

  feed(locale: Locale, cooked: Locale) {
    for (const key of Object.keys(locale)) {
      if (!NOT_MARKDOWN_PROPERTY.has(key) && locale[key]) {
        this._cache.feed(locale[key] as string, cooked[key] as string);
      }
    }
  }

  // thenable: the API's cooked locale, or the cached one at once
  cook(locale: Locale): {
    response?: CookedResponse | null;
    then(callback: (response: CookedResponse) => void): unknown;
  } {
    const missing: Locale = {};
    const result: Locale = {};
    let mustCallServer = false;

    for (const key of Object.keys(locale)) {
      if (NOT_MARKDOWN_PROPERTY.has(key) || !locale[key]) {
        result[key] = locale[key];
      } else if (this.has(locale[key] as string)) {
        result[key] = this.get(locale[key] as string);
      } else {
        mustCallServer = true;
        missing[key] = locale[key];
      }
    }

    if (mustCallServer) {
      return c2c.cooker(missing).then((response) => {
        this.feed(missing, response.data);

        // complete data with previously calculated data
        response.data = Object.assign(result, response.data);
      });
    } else {
      // otherwise, return a fake promise

      const response: CookedResponse = {
        data: result,
      };

      return {
        response,
        then(callback: (response: CookedResponse) => void) {
          callback(response);
        },
      };
    }
  }
}

export default new Cooker();
