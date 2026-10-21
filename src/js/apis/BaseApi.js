import axios from 'axios';
import { reactive } from 'vue';

import retryOn429 from './retry-on-429';

/// ////////////////////////////////////////////////////////////////////////////////
// Technically, we should do this in any API call to enhance promise with response :
// let result = axios.get(url).then(response => result.response = response)
//
// but, Promise prototype is not writable
// So let's polyfill it, whith a Promise-like object

const ApiData = function (promise) {
  // reactive itself: components show its loading, data and error. Vue 3 tracks changes made through the reactive
  // proxy only, not through the object it wraps: the request callbacks below must set them on the proxy
  const self = reactive(this);

  self.response = null;
  self.error = null;
  self.promise_ = promise;
  self.data = null;
  self.loading = true;

  promise.then(
    (response) => {
      self.loading = false;
      self.response = response;
      self.data = response.data;
    },
    (error) => {
      self.loading = false;
      self.error = error;
    }
  );

  return self;
};

ApiData.prototype.then = function (successCallback, errorCallback) {
  // then() returns this, not the derived promise: nobody can catch that one. Without an error callback, a failed
  // request would reject it unhandled; the error stays available in this.error and through catch().
  // Errors thrown by the callbacks are still reported.
  this.promise_.then(successCallback, errorCallback ?? (() => {}));
  return this;
};

ApiData.prototype.catch = function (callback) {
  this.promise_.catch(callback);
  return this;
};

const BaseApi = function (apiUrl) {
  this.axios = axios.create({
    // axios instances shares same common headers. this trick fix this.
    headers: { common: {} },
    baseURL: apiUrl,
  });
  retryOn429(this.axios);
};

/*
 * Generic request helpers
 */

BaseApi.prototype.get = function (url, params) {
  return new ApiData(this.axios.get(url, params));
};

BaseApi.prototype.post = function (url, body) {
  return new ApiData(this.axios.post(url, body));
};

BaseApi.prototype.put = function (url, body) {
  return new ApiData(this.axios.put(url, body));
};

BaseApi.prototype.delete = function (url, body) {
  return new ApiData(this.axios.delete(url, body));
};

export { ApiData };

export default BaseApi;
