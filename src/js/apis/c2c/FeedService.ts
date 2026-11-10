import { feed } from './schemas';
import type { Api, Params } from './types';

export default class FeedService {
  constructor(private api: Api) {}

  getDefaultFeed(params?: Params) {
    return this.api.getValidated('/feed', feed, { params });
  }

  getProfileFeed(params?: Params) {
    return this.api.getValidated('/profile-feed', feed, { params });
  }

  getPersonalFeed(params?: Params) {
    return this.api.getValidated('/personal-feed', feed, { params });
  }
}
