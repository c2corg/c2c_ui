
function DocumentService(api, type){
    this.type = type
    this.api = api
}


DocumentService.prototype.getAll = function(params){
    return this.api.get( '/' + this.type + 's', {params})
}

DocumentService.prototype.get = function(id){
    return this.api.get('/' + this.type + 's/' + id)
}

DocumentService.prototype.getVersion = function(id, lang, versionId){
    let url = '/' + this.type + 's/' + id + '/' + lang + '/' + versionId
    return this.api.get(url)
}

DocumentService.prototype.save = function(document, comment){
    return this.api.put('/' + this.type + 's/' + document.document_id, {
        document,
        message:comment
    })
}

DocumentService.prototype.getHistory = function(document_id, lang){
    return this.api.get('/document/' + document_id + '/history/' + lang)
}


export default DocumentService
