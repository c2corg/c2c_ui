import type { AxiosRequestConfig, AxiosResponse } from 'axios';

import AssociationService from './AssociationService';
import DocumentService from './DocumentService';
import FeedService from './FeedService';
import ForumService from './ForumService';
import ModeratorService from './ModeratorService';
import TagsService from './TagsService';
import UserProfileService from './UserProfileService';
import type { Params } from './types';

import BaseApi from '@/js/apis/BaseApi';
import config from '@/js/config';
import constants from '@/js/constants';

export class CamptocampApi extends BaseApi {
  userProfile: UserProfileService;
  moderator: ModeratorService;
  association: AssociationService;
  feed: FeedService;
  forum: ForumService;
  tags: TagsService;
  // one DocumentService per document type (c2c.route, c2c.waypoint...), from constants.documentTypes
  [documentType: string]: unknown;

  constructor() {
    super(config.urls.api);

    this.userProfile = new UserProfileService(this);
    this.moderator = new ModeratorService(this);
    this.association = new AssociationService(this);
    this.feed = new FeedService(this);
    this.forum = new ForumService(this);
    this.tags = new TagsService(this);

    for (const type of constants.documentTypes as string[]) {
      this[type] = new DocumentService(this, type);
    }

    // TODO
    // once https://github.com/c2corg/v6_api/issues/730 is fixed
    // add an intercpetor on 401 responses (not authorized), and if
    // user is logged, log-out it
    // this.axios.interceptors.response.use(
    //     response => response,
    //     function(error){
    //         return Promise.reject(error)
    //     }
    // )
  }

  getApiLang(lang: string): string {
    // some UI langs may not yet be present in API
    // some UI langs may also be more precise than API lang (zh for instance)

    if (lang === 'zh_CN') {
      return 'zh';
    } else {
      return lang;
    }
  }

  setAuthorizationToken(token: string | null) {
    if (token) {
      this.axios.defaults.headers.common.Authorization = 'JWT token="' + token + '"';
    } else if (this.axios.defaults.headers.common.Authorization) {
      delete this.axios.defaults.headers.common.Authorization;
    }
  }

  /* some function that not belong to a dedicated service */

  search(params?: Params) {
    return this.get('/search', { params });
  }

  getRecentChanges(params?: Params) {
    return this.get('/documents/changes', { params });
  }

  /* image service, I'm lazy. TODO :
   * uploadImage() must be a dedicated API in @/js/uploadFileApi.js
   * createImages() may not deserve a dedicated service, and can stay here
   */

  /*
   * Upload images service
   */
  uploadImage(
    file: Blob,
    onUploadProgress: AxiosRequestConfig['onUploadProgress'],
    onSuccess: (response: AxiosResponse) => unknown,
    onFailure: (error: unknown) => unknown
  ) {
    const formData = new FormData();

    formData.append('file', file);

    const requestConfig: AxiosRequestConfig = {
      headers: {
        'Content-Type': undefined, // overwrite with undefined
      },
      onUploadProgress,
    };

    /* can't user post_ helper: it's not the API url */
    /* TODO : move this function in another service... */
    return this.axios
      .post(config.urls.imageBackend + '/upload', formData, requestConfig)
      .then(onSuccess)
      .catch(onFailure);
  }

  createImages(images: object[]) {
    return this.post('/images/list', { images });
  }

  cooker(data: object) {
    return this.post('/cooker', data);
  }
}

// export a singleton
const c2c = new CamptocampApi();

export default c2c;
