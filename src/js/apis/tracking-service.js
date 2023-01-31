import axios from 'axios';

import config from '@/js/config';

function TrackingService() {
  this.baseURL = config.urls.tracking;
  this.axios = axios.create({ baseURL: this.baseURL, headers: { common: {} } });
}

Object.defineProperty(TrackingService.prototype, 'url', {
  get() {
    return this.baseURL;
  },
});

TrackingService.prototype.setAuthorizationToken = function (token) {
  if (token) {
    this.axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else if (this.axios.defaults.headers.common.Authorization) {
    delete this.axios.defaults.headers.common.Authorization;
  }
};

TrackingService.prototype.exchangeToken = function (vendor, userId, params) {
  return this.axios.get(`/${vendor}/exchange-token/${userId}`, { params });
};

TrackingService.prototype.requestGarminUnauthorizeRequestToken = function (userId) {
  return this.axios.get(`/garmin/request-token/${userId}`);
};

TrackingService.prototype.getStatus = function (userId) {
  return this.axios.get(`/users/${userId}/status`);
};

TrackingService.prototype.getActivities = function (userId, lang) {
  return this.axios.get(`/users/${userId}/activities${lang ? '?lang=' + lang : ''}`);
};

TrackingService.prototype.getActivityGeometry = function (userId, activityId) {
  return this.axios.get(`/users/${userId}/activities/${activityId}/geometry`);
};

TrackingService.prototype.deauthorize = function (vendor, userId) {
  return this.axios.post(`/${vendor}/deauthorize/${userId}`);
};

export default new TrackingService();
