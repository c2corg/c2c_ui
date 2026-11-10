import axios, { type AxiosInstance } from 'axios';

import config from '@/js/config';

export type Vendor = 'strava' | 'suunto' | 'garmin' | 'polar' | 'coros' | 'decathlon';

export type Status = 'not-configured' | 'configured' | 'token-lost';

export type Activity = {
  id: number;
  userId: number;
  vendor: Vendor;
  vendorId: string;
  date: string;
  name?: string;
  // the activity type, translated per language
  type: Record<string, string | undefined>;
  length?: number;
  heightDiffUp?: number;
  duration?: number;
  miniature?: string;
};

export type Geometry = { type: 'LineString'; coordinates: number[][] };

class TrackingService {
  baseURL: string | undefined;
  axios: AxiosInstance;

  constructor() {
    this.baseURL = config.urls.tracking;
    this.axios = axios.create({ baseURL: this.baseURL, headers: { common: {} } });
  }

  get url() {
    return this.baseURL;
  }

  setAuthorizationToken(token?: string | null) {
    if (token) {
      this.axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else if (this.axios.defaults.headers.common.Authorization) {
      delete this.axios.defaults.headers.common.Authorization;
    }
  }

  exchangeToken(vendor: Vendor, userId: number, params: unknown) {
    return this.axios.get(`/${vendor}/exchange-token/${userId}`, { params });
  }

  requestGarminUnauthorizeRequestToken(userId: number) {
    return this.axios.get<{ token: string }>(`/garmin/request-token/${userId}`);
  }

  getStatus(userId: number) {
    return this.axios.get<Partial<Record<Vendor, Status>>>(`/users/${userId}/status`);
  }

  getActivities(userId: number, lang?: string) {
    return this.axios.get<Activity[]>(`/users/${userId}/activities${lang ? '?lang=' + lang : ''}`);
  }

  getActivityGeometry(userId: number, activityId: number) {
    return this.axios.get<Geometry | undefined>(`/users/${userId}/activities/${activityId}/geometry`);
  }

  deauthorize(vendor: Vendor, userId: number) {
    return this.axios.post<void>(`/${vendor}/deauthorize/${userId}`);
  }
}

export default new TrackingService();
