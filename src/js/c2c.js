
import axios from 'axios';
import config from '@/js/config.js'
import constants from '@/js/constants.js'


///////////////////////////////////////////////////////////////////////////////////
// Technicly, we should do this in any API call to enhance promise with response :
// let result = axios.get(url).then(response => result.response = response)

// but, for a reason I do not understand, .response is not populated...

// So let's polyfill it, whith a Promise-like object

const ApiData = function(promise){

    let self = this

    this.response = null
    this.error = null
    this.promise = promise
    this.data = null

    promise.catch(error => {
        self.error = error
    })

    promise.then(response => {
        self.response = response
        self.data = response.data
    })
}

ApiData.prototype.then = function(callback){
    this.promise.then(callback)
    return this
}

ApiData.prototype.catch = function(callback){
    this.promise.catch(callback)
    return this
}

function UserApi(api){
    this.api = api

    this.preferences = {
        get(){
            return api.get_('/users/preferences')
        },

        post(preferences){
            return api.post_('/users/preferences', preferences)
        }
    }

    this.mailinglists = {
        get(){
            return api.get_('/users/mailinglists')
        },

        post(mailinglists){
            return api.post_('/users/mailinglists', mailinglists)
        }
    }

    this.following = {
        get(){
            return api.get_('/users/following')
        }
    }

    this.associations = {
        add(parent_document_id, child_document_id){
            return api.post_('/associations', { parent_document_id, child_document_id })
        }
    }

    this.account = {
        get(){
            return api.get_('/users/account')
        },

        post(currentpassword, name, forum_username,  email, is_profile_public, newpassword){
            var payload = {
                currentpassword,
            }

            if(name!==null)
                payload.name = name

            if(is_profile_public!==null)
                payload.is_profile_public = is_profile_public

            if(email!==null)
                payload.email = email

            if(forum_username!==null)
                payload.forum_username = forum_username

            if(newpassword!==null)
                payload.newpassword = newpassword

            return api.post_('/users/account', payload)
        }
    }
}

UserApi.prototype.login = function (username, password){
    return this.api.post_('/users/login', {
        username,
        password,
        discourse:false
    })
}

UserApi.prototype.update_preferred_language = function(lang){
    return this.api.post_('/users/update_preferred_language', {lang})
}


function buildDocumentApi(api, type){
    return {
        get(id){
            return api.get_('/' + type + 's/' + id)
        },

        getVersion(id, lang, versionId){
            let url = '/' + type + 's/' + id + '/' + lang + '/' + versionId
            return api.get(url)
        },

        save(document, comment){
            return api.put_('/' + type + 's/' + document.document_id, {
                document,
                message:comment
            })
        }
    }
}

function buildDocumentsApi(api, type){
    return {
        get(params){
            return api.get_( '/' + type + 's', {params})
        }
    }
}


function c2c(){
    // axios instances shares same common headers. this trick fix this.
    this.axios = axios.create({headers:{common:{}}});

    this.user = new UserApi(this)

    for(let type of constants.documentTypes){
        let def = constants.objectDefinitions[type]
        let documentService = buildDocumentApi(this, type)

        this[type + "s"] = buildDocumentsApi(this, type)
        this[type] = documentService
        this[def.letter] = documentService
    }
}


c2c.prototype.setToken = function(token){
    if(token){
        this.axios.defaults.headers.common.Authorization = 'JWT token="' + token + '"'
    } else if(this.axios.defaults.headers.common.Authorization){
        delete this.axios.defaults.headers.common.Authorization
    }
}

/**
 * Generic request helpers
 */
c2c.prototype.get_ = function(url, body){
    return new ApiData(this.axios.get(config.apiUrl + url, body))
}

c2c.prototype.post_ = function(url, body){
    return new ApiData(this.axios.post(config.apiUrl + url, body))
}

c2c.prototype.put_ = function(url, body){
    return new ApiData(this.axios.put(config.apiUrl + url, body))
}

c2c.prototype.delete_ = function(url, body){
    return new ApiData(this.axios.delete(config.apiUrl + url, body))
}


/**
 * Image url service
 */
c2c.prototype.getSmallImageUrl = function(image){
    return config.mediaUrl + '/' + image.filename.replace('.', 'MI.').replace('.svg', '.jpg')
}

c2c.prototype.getImageUrl = function(image){
    return config.mediaUrl + '/' + image.filename
}


/**
 * Search service
 */
c2c.prototype.search = function(params){
    return this.get_('/search', {params})
}


/**
 * Wiki service
 */
c2c.prototype.getRecentChanges = function(params){
    return this.get_('/documents/changes', {params})
}

c2c.prototype.getHistory = function(document_id, lang){
    return this.get_('/document/' + document_id + '/history/' + lang)
}


/**
 * Feed service
 */
c2c.prototype.getFeed = function(params){
    return this.get_('/feed', {params})
}

c2c.prototype.getProfileFeed = function(params){
    return this.get_('/profile-feed', {params})
}


/**
 * Upload images service
 */
c2c.prototype.uploadImage = function(file, onUploadProgress) {
    const formData = new FormData();

    formData.append('file', file);

    const requestConfig = {
        headers: {
            'Content-Type': undefined
        },
        onUploadProgress,
    }

    /* can't user post_ helper: it's not the API url */
    /* TODO : move this function in another service... */
    return this.axios.post(config.imageBackendUrl + '/upload', formData, requestConfig)
}

c2c.prototype.createImages = function(images){
    return this.post_('/images/list', {images})
}


/**
 * Associations service
 */
 /* TODO : document_id in prototype */
c2c.prototype.createAssociation = function(parent, child) {

    var pType = parent.type
    var cType = child.type

    const data = {}

    // parent and child type are predetermined
    if(
        (pType === 'c' && (cType === 'w' || cType === 'o' || cType === 'r' || cType === 'b' || cType === 'c'))
            ||
        pType === 'i'
            ||
        (pType === 'o' && (cType === 'r' || cType === 'u'))
            ||
        (pType === 'r' && (cType === 'w' || cType === 'b'))
            ||
        (pType === 'w' && cType === 'b')
            ||
        (pType === 'x' && (cType === 'r' || cType === 'o' || cType === 'w'))
    ) {
        data.parent_document_id = child.document_id
        data.child_document_id = parent.document_id
    } else {
        data.parent_document_id = parent.document_id
        data.child_document_id = child.document_id
    }

    return this.post_('/associations', data)
}

/* TODO : document_id in prototype */
c2c.prototype.removeAssociation = function(parent, child) {
    const data = {
        parent_document_id: parent.document_id,
        child_document_id: child.document_id,
    }

    return this.delete_('/associations', {data})
}


/**
 * Protection service
 */
c2c.prototype.protectDocument = function(documentId) {
    return this.post_('/documents/protect', {'document_id': documentId})
}

c2c.prototype.unprotectDocument = function(documentId) {
    return this.post_('/documents/unprotect', {'document_id': documentId})
}

/**
 * Delete service
 */

c2c.prototype.deleteDocument = function(documentId) {
    return this.delete_('/documents/delete/' + documentId)
};


/**
 * Merge service
 */
c2c.prototype.mergeDocuments = function(sourceDocumentId, targetDocumentId) {
    const data = {
        'source_document_id': sourceDocumentId,
        'target_document_id': targetDocumentId
    }

    return this.post_('/documents/merge', data)
}


export default new c2c();
