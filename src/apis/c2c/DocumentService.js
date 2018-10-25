
function DocumentService(api, documentType){
    this.documentType = documentType
    this.api = api
}


DocumentService.prototype.getAll = function(params){
    return this.api.get( '/' + this.documentType + 's', {params})
}

DocumentService.prototype.get = function(id){
    return this.api.get('/' + this.documentType + 's/' + id)
}

DocumentService.prototype.getVersion = function(id, lang, versionId){
    let url = '/' + this.documentType + 's/' + id + '/' + lang + '/' + versionId
    return this.api.get(url)
}

DocumentService.prototype.save = function(document, comment){
    return this.api.put('/' + this.documentType + 's/' + document.document_id, {
        document,
        message:comment
    })
}

DocumentService.prototype.create = function(document){
    return this.api.post('/' + this.documentType + 's', document)
}

DocumentService.prototype.getHistory = function(document_id, lang){
    return this.api.get('/document/' + document_id + '/history/' + lang)
}

export default DocumentService
