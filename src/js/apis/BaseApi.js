import axios from 'axios';

/// ////////////////////////////////////////////////////////////////////////////////
// Technically, we should do this in any API call to enhance promise with response :
// let result = axios.get(url).then(response => result.response = response)
//
// but, Promise prototype is not writable
// So let's polyfill it, whith a Promise-like object

const ApiData = function (promise) {
  const self = this;

  this.response = null;
  this.error = null;
  this.promise_ = promise;
  this.data = null;
  this.loading = true;

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
};

ApiData.prototype.then = function (callback) {
  this.promise_.then(callback);
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
};

/**
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

export default BaseApi;
