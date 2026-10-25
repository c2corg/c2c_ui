import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { reactive } from 'vue';
import type { z } from 'zod';

import { checkResponse } from './check-response';
import retryOn429 from './retry-on-429';

/// ////////////////////////////////////////////////////////////////////////////////
// Technically, we should do this in any API call to enhance promise with response :
// let result = axios.get(url).then(response => result.response = response)
//
// but, Promise prototype is not writable
// So let's polyfill it, whith a Promise-like object

// T: the type of the response data. any until the API responses are typed (#4747)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ApiData<T = any> {
  response: AxiosResponse<T> | null = null;
  error: unknown = null;
  data: T | null = null;
  loading = true;
  // set through the reactive proxy in the constructor
  private promise_!: Promise<AxiosResponse<T>>;

  constructor(promise: Promise<AxiosResponse<T>>) {
    // reactive itself: components show its loading, data and error. Vue 3 tracks changes made through the reactive
    // proxy only, not through the object it wraps: the request callbacks below must set them on the proxy
    const self = reactive(this) as this;

    self.promise_ = promise;

    promise.then(
      (response) => {
        self.loading = false;
        self.response = response;
        self.data = response.data;
      },
      (error: unknown) => {
        self.loading = false;
        self.error = error;
      }
    );

    return self;
  }

  then(successCallback?: (response: AxiosResponse<T>) => unknown, errorCallback?: (error: unknown) => unknown): this {
    // then() returns this, not the derived promise: nobody can catch that one. Without an error callback, a failed
    // request would reject it unhandled; the error stays available in this.error and through catch().
    // Errors thrown by the callbacks are still reported.
    this.promise_.then(successCallback, errorCallback ?? (() => {}));
    return this;
  }

  catch(callback: (error: unknown) => unknown): this {
    this.promise_.catch(callback);
    return this;
  }
}

export default class BaseApi {
  axios: AxiosInstance;

  constructor(apiUrl: string) {
    this.axios = axios.create({
      // axios instances shares same common headers. this trick fix this.
      headers: { common: {} },
      baseURL: apiUrl,
    });
    retryOn429(this.axios);
  }

  /*
   * Generic request helpers
   */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get<T = any>(url: string, params?: AxiosRequestConfig): ApiData<T> {
    return new ApiData(this.axios.get<T>(url, params));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post<T = any>(url: string, body?: unknown): ApiData<T> {
    return new ApiData(this.axios.post<T>(url, body));
  }

  // the same requests, whose response is checked against its schema (check-response.ts), and typed by it
  getValidated<S extends z.ZodType>(url: string, schema: S, params?: AxiosRequestConfig): ApiData<z.infer<S>> {
    return new ApiData(this.validated(this.axios.get(url, params), schema, `GET ${url}`));
  }

  postValidated<S extends z.ZodType>(url: string, schema: S, body?: unknown): ApiData<z.infer<S>> {
    return new ApiData(this.validated(this.axios.post(url, body), schema, `POST ${url}`));
  }

  private validated<S extends z.ZodType>(
    request: Promise<AxiosResponse>,
    schema: S,
    description: string
  ): Promise<AxiosResponse<z.infer<S>>> {
    return request.then((response) => {
      checkResponse(schema, response.data, description);
      return response;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  put<T = any>(url: string, body?: unknown): ApiData<T> {
    return new ApiData(this.axios.put<T>(url, body));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete<T = any>(url: string, body?: AxiosRequestConfig): ApiData<T> {
    return new ApiData(this.axios.delete<T>(url, body));
  }
}
