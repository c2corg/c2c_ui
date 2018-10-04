function ModeratorService(api){
    this.api = api
}

/**
 * Protection service
 */
ModeratorService.prototype.protectDocument = function(documentId) {
    return this.api.post('/documents/protect', {'document_id': documentId})
}

ModeratorService.prototype.unprotectDocument = function(documentId) {
    return this.api.post('/documents/unprotect', {'document_id': documentId})
}

/**
 * Delete service
 */

ModeratorService.prototype.deleteDocument = function(documentId) {
    return this.api.delete('/documents/delete/' + documentId)
};


/**
 * Merge service
 */
ModeratorService.prototype.mergeDocuments = function(sourceDocumentId, targetDocumentId) {
    const data = {
        'source_document_id': sourceDocumentId,
        'target_document_id': targetDocumentId
    }

    return this.api.post('/documents/merge', data)
}

export default ModeratorService
