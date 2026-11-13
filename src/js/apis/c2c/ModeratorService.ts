import type { Api, DocumentId } from './types';

export type AccountRemovalReason = 'anonymization' | 'merge' | 'spam';
export type AccountRemovalSide = 'topoguide' | 'forum';
export type AccountRemovalStatus = 'in_progress' | 'validated' | 'done';

type Person = { id: number; name: string | null };

// GET /users/removals (v6_api views/user_removal.py)
export type AccountRemoval = {
  id: number;
  user_id: number;
  forum_id: number | null;
  user_name: string;
  user_forum_username: string;
  reason: AccountRemovalReason;
  executable_after: string;
  target_user_id: number;
  target_forum_id: number;
  forum_url: string | null;
  created_at: string;
  requested_by: Person;
  topoguide_validated_by: Person | null;
  topoguide_validated_at: string | null;
  forum_validated_by: Person | null;
  forum_validated_at: string | null;
  done_at: string | null;
  status: AccountRemovalStatus;
};

export type AccountRemovalCreation = {
  user_id: DocumentId;
  reason: AccountRemovalReason;
  executable_after: string;
  target_user_id: number;
  target_forum_id: number;
  forum_url?: string;
};

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

  /** Account removal requests (anonymization, merge, spam) */
  getAccountRemovals() {
    return this.api.get<{ removals: AccountRemoval[]; roles: Record<AccountRemovalSide, boolean> }>('/users/removals');
  }

  countAccountRemovals() {
    return this.api.get<{ open: number }>('/users/removals/count');
  }

  requestAccountRemoval(removal: AccountRemovalCreation) {
    return this.api.post('/users/removals', removal);
  }

  validateAccountRemoval(id: number, side: AccountRemovalSide) {
    return this.api.post('/users/removals/validate', { id, side });
  }

  unvalidateAccountRemoval(id: number, side: AccountRemovalSide, forumUrl: string) {
    return this.api.post('/users/removals/unvalidate', { id, side, forum_url: forumUrl });
  }

  updateAccountRemovalUrl(id: number, forumUrl: string) {
    return this.api.post('/users/removals/update', { id, forum_url: forumUrl });
  }

  cancelAccountRemoval(id: number) {
    return this.api.post('/users/removals/cancel', { id });
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
