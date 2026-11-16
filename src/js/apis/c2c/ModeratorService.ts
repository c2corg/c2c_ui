import { deletedDocumentDetails, deletedDocumentsPage, restoreResult } from './schemas';
import type { Api, DocumentId } from './types';

export default class ModeratorService {
  constructor(private api: Api) {}

  /*
   * Protection service
   */
  protectDocument(documentId: DocumentId) {
    return this.api.post('/documents/protect', { document_id: documentId });
  }

  unprotectDocument(documentId: DocumentId) {
    return this.api.post('/documents/unprotect', { document_id: documentId });
  }

  /*
   * Delete service
   */

  deleteDocument(documentId: DocumentId) {
    return this.api.delete('/documents/delete/' + documentId);
  }

  deleteLocale(documentId: DocumentId, lang: string) {
    const url = '/documents/delete/' + String(documentId) + '/' + lang;
    return this.api.delete(url, {});
  }

  /*
   * Deleted documents, kept 29 days by the API to be restored
   */
  getDeletedDocuments(offset = 0, limit = 30, filters: DeletedDocumentsFilters = {}) {
    return this.api.getValidated('/documents/deleted', deletedDocumentsPage, {
      params: { offset, limit, ...filters },
    });
  }

  getDeletedDocument(id: number) {
    return this.api.getValidated('/documents/deleted/' + id, deletedDocumentDetails);
  }

  restoreDeletedDocument(id: number) {
    // $gettext('This document was already restored', 'API message')
    // $gettext('This document was deleted too long ago', 'API message')
    // $gettext('The document exists', 'API message')
    // $gettext('The document was deleted: restore it first', 'API message')
    // $gettext('The locale was written again since its deletion', 'API message')
    return this.api.postValidated('/documents/deleted/' + id + '/restore', restoreResult, {});
  }

  /*
   * Merge service
   */
  mergeDocuments(sourceDocumentId: DocumentId, targetDocumentId: DocumentId) {
    const data = {
      source_document_id: sourceDocumentId,
      target_document_id: targetDocumentId,
    };

    return this.api.post('/documents/merge', data);
  }

  revertDocument(documentId: DocumentId, lang: string, versionId: DocumentId) {
    return this.api.post('/documents/revert', {
      document_id: documentId,
      lang,
      version_id: versionId,
    });
  }

  /** Block account service */
  isAccountBlocked(userId: DocumentId) {
    return this.api.get('/users/blocked/' + userId);
  }

  blockAccount(userId: DocumentId) {
    return this.api.post('/users/block', { user_id: userId });
  }

  unblockAccount(userId: DocumentId) {
    return this.api.post('/users/unblock', { user_id: userId });
  }

  /** Mask/unmask version service */
  maskVersion(documentId: DocumentId, lang: string, versionId: DocumentId) {
    return this.api.post('/versions/mask', {
      document_id: documentId,
      lang: lang,
      version_id: versionId,
    });
  }

  unmaskVersion(documentId: DocumentId, lang: string, versionId: DocumentId) {
    return this.api.post('/versions/unmask', {
      document_id: documentId,
      lang: lang,
      version_id: versionId,
    });
  }
}

/** The filters of the deleted documents: a type letter, user ids, days (YYYY-MM-DD, included) */
export interface DeletedDocumentsFilters {
  type?: string;
  author?: number;
  deleted_by?: number;
  deleted_since?: string;
  deleted_until?: string;
}
