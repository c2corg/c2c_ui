import type { Api, Params } from './types';

export default class FeedService {
  constructor(private api: Api) {}

  getDefaultFeed(params?: Params) {
    return this.api.get('/feed', { params });
  }

  getProfileFeed(params?: Params) {
    return this.api.get('/profile-feed', { params });
  }

  getPersonalFeed(params?: Params) {
    return this.api.get('/personal-feed', { params });
  }
}
