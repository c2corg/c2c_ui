import axios from 'axios'
import config from '@/js/config'

///////////////////////////////////////////////////////////////////////////////////
// Technicly, we should do this in any API call to enhance promise with response :
// let result = axios.get(url).then(response => result.response = response)
//
// but, Promise prototype is not writable
// So let's polyfill it, whith a Promise-like object


const ApiData = function(promise){

    let self = this

    this.response = null
    this.error = null
    this.promise_ = promise
    this.data = null
    this.loading = true

    promise.then(
        response => {
            self.loading = false
            self.response = response
            self.data = response.data
        },
        error => {
            self.loading = false
            self.error = error
        }
    )
}

ApiData.prototype.then = function(callback){
    this.promise_.then(callback)
    return this
}

ApiData.prototype.catch = function(callback){
    this.promise_.catch(callback)
    return this
}

const BaseApi = function(apiUrl){
    // axios instances shares same common headers. this trick fix this.
    this.axios = axios.create({headers:{common:{}}})

    this.apiUrl = apiUrl
}

/**
 * Generic request helpers
 */
if(config.urls.readWrite){
    BaseApi.prototype.checkReadOnly = function() {}
} else {
    BaseApi.prototype.checkReadOnly = function(safeCall){
        if(!safeCall)
            throw new Error("This build is read only")
    }
}

BaseApi.prototype.get = function(url, body){
    return new ApiData(this.axios.get(this.apiUrl + url, body))
}

BaseApi.prototype.post = function(url, body, safeCall){
    this.checkReadOnly(safeCall)
    return new ApiData(this.axios.post(this.apiUrl + url, body))
}

BaseApi.prototype.put = function(url, body, safeCall){
    this.checkReadOnly(safeCall)
    return new ApiData(this.axios.put(this.apiUrl + url, body))
}

BaseApi.prototype.delete = function(url, body, safeCall){
    this.checkReadOnly(safeCall)
    return new ApiData(this.axios.delete(this.apiUrl + url, body))
}

export default BaseApi
