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

const Cooker = function () {
  this._cache = new Cache();
};

Cooker.prototype.has = function (markdown) {
  return this._cache.has(markdown);
};

Cooker.prototype.get = function (markdown) {
  return this._cache.get(markdown);
};

Cooker.prototype.feed = function (locale, cooked) {
  for (const key of Object.keys(locale)) {
    if (!NOT_MARKDOWN_PROPERTY.has(key) && locale[key]) {
      this._cache.feed(locale[key], cooked[key]);
    }
  }
};

Cooker.prototype.cook = function (locale) {
  const missing = {};
  const result = {};
  let mustCallServer = false;

  for (const key of Object.keys(locale)) {
    if (NOT_MARKDOWN_PROPERTY.has(key) || !locale[key]) {
      result[key] = locale[key];
    } else if (this.has(locale[key])) {
      result[key] = this.get(locale[key]);
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

    const response = {
      data: result,
    };

    return {
      response,
      then(callback) {
        callback(response);
      },
    };
  }
};

export default new Cooker();
