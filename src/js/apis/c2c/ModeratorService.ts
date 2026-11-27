import {
  accountRemoval,
  accountRemovalsCount,
  accountRemovalsPage,
  deletedDocumentDetails,
  deletedDocumentsPage,
  dismissedDuplicates,
  duplicateImagesPage,
  externalHostReview,
  externalLinkRecheck,
  externalLinkReview,
  externalLinksPage,
  imagesOfDeletion,
  brokenEmbedsPage,
  brokenLinksPage,
  orphanImagesPage,
  restoreResult,
  unmergeResult,
  type AccountRemoval,
  type AccountRemovalReason,
  type AccountRemovalSide,
  type ExternalLinkStatus,
} from './schemas';
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

  // what the deletion does to the images linked to the document, asked before deleting it
  getImagesOfDeletion(documentId: DocumentId) {
    return this.api.getValidated('/documents/delete/' + documentId + '/images', imagesOfDeletion);
  }

  deleteLocale(documentId: DocumentId, lang: string) {
    const url = '/documents/delete/' + String(documentId) + '/' + lang;
    return this.api.delete(url, {});
  }

  /*
   * Deleted documents and merges, kept 29 days by the API to be restored or undone
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

  unmergeDocument(id: number) {
    // $gettext('This merge was already undone', 'API message')
    // $gettext('This merge was done too long ago', 'API message')
    // $gettext('Unknown format of the merge', 'API message')
    // $gettext('The target was deleted: restore it first', 'API message')
    // $gettext('The source was deleted: restore it first', 'API message')
    // $gettext('The target was merged since into another document: undo that first', 'API message')
    // $gettext('The source no longer redirects to the target', 'API message')
    return this.api.postValidated('/documents/merged/' + id + '/unmerge', unmergeResult, {});
  }

  /*
   * Images linked to no document
   */
  getOrphanImages(offset = 0, limit = 30, imageType?: string) {
    return this.api.getValidated('/images/orphans', orphanImagesPage, {
      params: { offset, limit, image_type: imageType || undefined },
    });
  }

  /*
   * The images shown in the texts of documents ([img=ID]) that do not show: deleted, missing or not an image
   */
  getBrokenEmbeds(offset = 0, limit = 30) {
    return this.api.getValidated('/images/broken-embeds', brokenEmbedsPage, { params: { offset, limit } });
  }

  /*
   * The links in the texts of collaborative documents whose page does not show the document: deleted, missing, of
   * another type, or of an unknown type
   */
  getBrokenLinks(offset = 0, limit = 30) {
    return this.api.getValidated('/documents/broken-links', brokenLinksPage, { params: { offset, limit } });
  }

  /*
   * The links to other sites of collaborative documents, as checked: by default the ones that need a look (dead,
   * failing, parked, suspect, offsite); `reviewed`: those reviewed genuine or of a trusted host instead
   */
  getExternalLinks(
    offset = 0,
    limit = 30,
    { statuses, host, reviewed }: { statuses?: ExternalLinkStatus[]; host?: string; reviewed?: boolean } = {}
  ) {
    return this.api.getValidated('/documents/external-links', externalLinksPage, {
      params: {
        offset,
        limit,
        status: statuses?.length ? statuses.join(',') : undefined,
        host: host || undefined,
        reviewed: reviewed || undefined,
      },
    });
  }

  // null: no review any more
  reviewExternalLink(url: string, review: 'genuine' | 'taken_over' | null) {
    return this.api.postValidated('/documents/external-links/review', externalLinkReview, { url, review });
  }

  // a trusted host: its links are genuine, even those its robots.txt keeps from being checked
  reviewExternalHost(host: string, review: 'trusted' | null) {
    return this.api.postValidated('/documents/external-links/review-host', externalHostReview, { host, review });
  }

  // checked again at the next run of the checker (every 10 minutes)
  recheckExternalLink(url: string) {
    return this.api.postValidated('/documents/external-links/recheck', externalLinkRecheck, { url });
  }

  /*
   * Images uploaded more than once: merged with POST /documents/merge, deleted, or dismissed
   */
  getDuplicateImages(offset = 0, limit = 30, sameDocument = false) {
    return this.api.getValidated('/images/duplicates', duplicateImagesPage, {
      params: { offset, limit, same_document: sameDocument || undefined },
    });
  }

  // without `against`: all the images of `imageIds` are not copies of each other. With `against`: each image of
  // `imageIds` is not a copy of those of `against`
  dismissDuplicateImages(imageIds: DocumentId[], against?: DocumentId[]) {
    return this.api.postValidated('/images/duplicates/dismiss', dismissedDuplicates, {
      image_ids: imageIds,
      ...(against ? { against } : {}),
    });
  }

  /*
   * Removal requests of user accounts: anonymization, merge with another account of the user, spam
   */
  // open: in progress or validated, the ones still to process
  getAccountRemovals(status: 'open' | 'done' | 'cancelled', offset = 0, limit = 30) {
    return this.api.getValidated('/users/removals', accountRemovalsPage, { params: { status, offset, limit } });
  }

  countAccountRemovals() {
    return this.api.getValidated('/users/removals/count', accountRemovalsCount);
  }

  requestAccountRemoval(request: AccountRemovalRequest) {
    return this.api.postValidated('/users/removals', accountRemoval, request);
  }

  // the forum discussion, while the request is in progress
  updateAccountRemoval(id: number, forumUrl: string) {
    return this.api.put<AccountRemoval>('/users/removals/' + id, { forum_url: forumUrl });
  }

  validateAccountRemoval(id: number, side: AccountRemovalSide) {
    return this.api.postValidated(`/users/removals/${id}/validate`, accountRemoval, { side });
  }

  // a new forum discussion may be given, the same one is kept otherwise
  unvalidateAccountRemoval(id: number, side: AccountRemovalSide, forumUrl?: string) {
    return this.api.postValidated(`/users/removals/${id}/unvalidate`, accountRemoval, {
      side,
      ...(forumUrl ? { forum_url: forumUrl } : {}),
    });
  }

  cancelAccountRemoval(id: number, forumUrl?: string) {
    return this.api.postValidated(
      `/users/removals/${id}/cancel`,
      accountRemoval,
      forumUrl ? { forum_url: forumUrl } : {}
    );
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
  // only the deletions, or only the merges
  kind?: 'deleted' | 'merged';
}

// POST /users/removals: the API finds the forum accounts; an anonymization and a spam go to the closed account
export type AccountRemovalRequest = {
  user_id: number;
  reason: AccountRemovalReason;
  // when the user asked for it: required for an anonymization, which waits 7 days after it
  user_request_date?: string;
  executable_after: string;
  // the other account of the user, for a merge
  target_user_id?: number;
  forum_url?: string;
};
