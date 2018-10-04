import axios from 'axios';

///////////////////////////////////////////////////////////////////////////////////
// Technicly, we should do this in any API call to enhance promise with response :
// let result = axios.get(url).then(response => result.response = response)
//
// but, for a reason I do not understand, .response is not populated...
//
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

const BaseApi = function(apiUrl){
    // axios instances shares same common headers. this trick fix this.
    this.axios = axios.create({headers:{common:{}}})

    this.apiUrl = apiUrl
}

/**
 * Generic request helpers
 */
BaseApi.prototype.get = function(url, body){
    return new ApiData(this.axios.get(this.apiUrl + url, body))
}

BaseApi.prototype.post = function(url, body){
    return new ApiData(this.axios.post(this.apiUrl + url, body))
}

BaseApi.prototype.put = function(url, body){
    return new ApiData(this.axios.put(this.apiUrl + url, body))
}

BaseApi.prototype.delete = function(url, body){
    return new ApiData(this.axios.delete(this.apiUrl + url, body))
}

export default BaseApi
