import config from '@/js/config.js'
import constants from '@/js/constants'

import BaseApi from '@/js/apis/BaseApi.js'
import UserProfileService from './UserProfileService.js'
import DocumentService from './DocumentService.js'
import ModeratorService from './ModeratorService.js'
import AssociationService from './AssociationService.js'
import FeedService from './FeedService.js'

function CamptocampApi() {
    // inherits properties
    BaseApi.call(this, config.urls.api)

    this.userProfile = new UserProfileService(this)
    this.moderator = new ModeratorService(this)
    this.association = new AssociationService(this)
    this.feed = new FeedService(this)

    for (let type of constants.documentTypes) {
        this[type] = new DocumentService(this, type)
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

// inherits prototype
CamptocampApi.prototype = Object.create(BaseApi.prototype)

// restore good contructor
CamptocampApi.prototype.constructor = CamptocampApi

CamptocampApi.prototype.setAuthorizationToken = function(token) {
    if (token) {
        this.axios.defaults.headers.common.Authorization = 'JWT token="' + token + '"'
    } else if (this.axios.defaults.headers.common.Authorization) {
        delete this.axios.defaults.headers.common.Authorization
    }
}

/* some function that not belong to a dedicated service */

CamptocampApi.prototype.search = function(params) {
    return this.get('/search', { params })
}
CamptocampApi.prototype.getRecentChanges = function(params) {
    return this.get('/documents/changes', { params })
}

/* image service, I'm lazy. TODO :
 * uploadImage() must be a dedicated API in @/js/uploadFileApi.js
 * createImages() may not deserve a dedicated service, and can stay here
 */

/**
 * Upload images service
 */
CamptocampApi.prototype.uploadImage = function(file, onUploadProgress) {
    const formData = new FormData()

    formData.append('file', file)

    const requestConfig = {
        headers: {
            'Content-Type': undefined // overwrite with undefined
        },
        onUploadProgress
    }

    /* can't user post_ helper: it's not the API url */
    /* TODO : move this function in another service... */
    return this.axios.post(config.urls.imageBackend + '/upload', formData, requestConfig)
}

CamptocampApi.prototype.createImages = function(images) {
    return this.post('/images/list', { images })
}

CamptocampApi.prototype.cooker = function(data) {
    return this.post('/cooker', data)
}

// export a singleton
export default new CamptocampApi()
