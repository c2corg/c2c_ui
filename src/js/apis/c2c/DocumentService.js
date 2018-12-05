import { cook_document } from '@/js/markdown.js'

function DocumentService(api, documentType) {
    this.documentType = documentType
    this.api = api
}

DocumentService.prototype.getAll = function(params) {
    return this.api.get('/' + this.documentType + 's', { params })
}

DocumentService.prototype.get = function(id, lang) {
    return this.api.get('/' + this.documentType + 's/' + id, { params: { l: lang } })
}

DocumentService.prototype.getCooked = function(id, prefered_lang) {
    var promise = this.api.get('/' + this.documentType + 's/' + id)

    promise.then(response => cook_document(response.data, prefered_lang))

    return promise
}

DocumentService.prototype.getVersion = function(id, lang, versionId, cooked) {
    let url = '/' + this.documentType + 's/' + id + '/' + lang + '/' + versionId
    return this.api.get(url).then((response) => {
        if (cooked) {
            cook_document(response.data.document, lang)
        }
    })
}

DocumentService.prototype.save = function(document, comment) {
    return this.api.put('/' + this.documentType + 's/' + document.document_id, {
        document,
        message: comment
    })
}

DocumentService.prototype.create = function(document) {
    return this.api.post('/' + this.documentType + 's', document)
}

DocumentService.prototype.getHistory = function(document_id, lang) {
    return this.api.get('/document/' + document_id + '/history/' + lang)
}

export default DocumentService
