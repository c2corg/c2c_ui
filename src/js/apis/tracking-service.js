import axios from 'axios';

import config from '@/js/config';

/** @typedef {'strava' | 'suunto' | 'garmin' | 'polar' | 'coros' | 'decathlon'} Vendor */

function TrackingService() {
  this.baseURL = config.urls.tracking;
  this.axios = axios.create({ baseURL: this.baseURL, headers: { common: {} } });
}

Object.defineProperty(TrackingService.prototype, 'url', {
  get() {
    return this.baseURL;
  },
});

/** @param {string} [token] */
TrackingService.prototype.setAuthorizationToken = function (token) {
  if (token) {
    this.axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else if (this.axios.defaults.headers.common.Authorization) {
    delete this.axios.defaults.headers.common.Authorization;
  }
};

/**
 * @param {Vendor} vendor
 * @param {number} userId
 * @param {any} params
 * @returns
 */
TrackingService.prototype.exchangeToken = function (vendor, userId, params) {
  return this.axios.get(`/${vendor}/exchange-token/${userId}`, { params });
};

/**
 * @param {number} userId
 * @returns {Promise<{ data: { token: string } }>}
 */
TrackingService.prototype.requestGarminUnauthorizeRequestToken = function (userId) {
  return this.axios.get(`/garmin/request-token/${userId}`);
};

/** @typedef {'not-configured' | 'configured' | 'token-lost'} Status */
/**
 * @param {number} userId
 * @returns {Promise<{ data: { [key in Vendor]?: Status } }>}
 */
TrackingService.prototype.getStatus = function (userId) {
  return this.axios.get(`/users/${userId}/status`);
};

/**
 * @typedef Activity
 * @property {number} id
 * @property {number} userId
 * @property {Vendor} vendor
 * @property {string} vendorId
 * @property {string} date
 * @property {string} [name]
 * @property {[key in import('@/js/vue-plugins/gettext-plugin.js').Lang]?: string} type
 * @property {number} [length]
 * @property {number} [heightDiffUp]
 * @property {number} [duration]
 * @property {string} [miniature]
 */
/**
 * @param {number} userId
 * @param {Lang} [lang]
 * @returns {Promise<{ data: Activity[] }>}
 */
TrackingService.prototype.getActivities = function (userId, lang) {
  return this.axios.get(`/users/${userId}/activities${lang ? '?lang=' + lang : ''}`);
};

/**
 * @typedef Geometry
 * @property {'LineString'} type
 * @property {number[][]} coordinates
 */
/**
 * @param {number} userId
 * @param {number} activityId
 * @returns {Promise<{data: Geometry | undefined>}}
 */
TrackingService.prototype.getActivityGeometry = function (userId, activityId) {
  return this.axios.get(`/users/${userId}/activities/${activityId}/geometry`);
};

/**
 * @param {Vendor} vendor
 * @param {number} userId
 * @returns {Promise<void>}
 */
TrackingService.prototype.deauthorize = function (vendor, userId) {
  return this.axios.post(`/${vendor}/deauthorize/${userId}`);
};

export default new TrackingService();
