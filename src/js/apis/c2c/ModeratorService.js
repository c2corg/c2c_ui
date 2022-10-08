function ModeratorService(api) {
  this.api = api;
}

/**
 * Protection service
 */
ModeratorService.prototype.protectDocument = function (documentId) {
  return this.api.post('/documents/protect', { document_id: documentId });
};

ModeratorService.prototype.unprotectDocument = function (documentId) {
  return this.api.post('/documents/unprotect', { document_id: documentId });
};

/**
 * Delete service
 */

ModeratorService.prototype.deleteDocument = function (documentId) {
  return this.api.delete('/documents/delete/' + documentId);
};

ModeratorService.prototype.deleteLocale = function (documentId, lang) {
  const url = '/documents/delete/' + String(documentId) + '/' + lang;
  return this.api.delete(url, {});
};

/**
 * Merge service
 */
ModeratorService.prototype.mergeDocuments = function (sourceDocumentId, targetDocumentId) {
  const data = {
    source_document_id: sourceDocumentId,
    target_document_id: targetDocumentId,
  };

  return this.api.post('/documents/merge', data);
};

ModeratorService.prototype.revertDocument = function (documentId, lang, versionId) {
  return this.api.post('/documents/revert', {
    document_id: documentId,
    lang,
    version_id: versionId,
  });
};

/**
 * block account service
 */
ModeratorService.prototype.isAccountBlocked = function (userId) {
  return this.api.get('/users/blocked/' + userId);
};

ModeratorService.prototype.blockAccount = function (userId) {
  return this.api.post('/users/block', { user_id: userId });
};

ModeratorService.prototype.unblockAccount = function (userId) {
  return this.api.post('/users/unblock', { user_id: userId });
};

/**
 * Mask/unmask version service
 */
ModeratorService.prototype.maskVersion = function (documentId, lang, versionId) {
  return this.api.post('/versions/mask', {
    document_id: documentId, lang: lang, version_id: versionId
  });
};

ModeratorService.prototype.unmaskVersion = function (documentId, lang, versionId) {
  return this.api.post('/versions/unmask', {
    document_id: documentId, lang: lang, version_id: versionId
  });
};

export default ModeratorService;
