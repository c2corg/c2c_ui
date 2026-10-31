// Whether the user can edit or delete a document. If the user is not logged, a document may still be editable: the
// edit button is shown, and leads to the login. The document views use them through useDocumentView(), the components
// given a document through useEditable().
import { computed, getCurrentInstance } from 'vue';

import { useViewMode } from '@/js/composables/view-mode';

// what the rules read of a document
type Document = {
  document_id?: number;
  protected?: boolean;
  image_type?: string;
  article_type?: string;
  author?: { user_id: number } | string | null;
  creator?: { user_id: number } | null;
  associations?: { users?: { document_id?: number }[] };
};

// the user who wrote an article or an xreport (the author of a book or an image is a name)
const authorId = (document: Document) => (typeof document.author === 'object' ? document.author?.user_id : undefined);

type User = { readonly isModerator: boolean; id: number | null };

const isAssociatedUser = (document: Document, user: User) =>
  (document.associations?.users ?? []).some((associated) => associated.document_id === user.id);

export function isEditable(document: Document, documentType: string, user: User, isNormalView: boolean): boolean {
  if (!isNormalView) {
    return false;
  }

  if (user.isModerator) {
    return true;
  }

  if (document.protected) {
    return false;
  }

  if (['route', 'waypoint', 'area', 'book', 'map'].includes(documentType)) {
    return true;
  }

  if (documentType === 'profile') {
    return document.document_id === user.id;
  }

  if (documentType === 'article') {
    if (document.article_type === 'collab') {
      return true;
    }

    return authorId(document) === user.id;
  }

  if (documentType === 'xreport') {
    return authorId(document) === user.id || isAssociatedUser(document, user);
  }

  if (documentType === 'outing') {
    return isAssociatedUser(document, user);
  }

  if (documentType === 'image') {
    if (document.image_type === 'collaborative') {
      return true;
    } else if (['personal', 'copyright'].includes(document.image_type ?? '')) {
      return document.creator?.user_id === user.id;
    } else {
      throw new Error(`Unexpected image_type : ${document.image_type}`);
    }
  }

  return false;
}

export function isDeletable(document: Document, documentType: string, user: User, isNormalView: boolean): boolean {
  // first of all, if it's not editable, you can't delete it.
  if (!isEditable(document, documentType, user, isNormalView)) {
    return false;
  }

  // note that some code is quite redundant, as isEditable will do most part of the job.
  // But as rules may changes, it's way more safe to explicitly write this rules

  // Each type of doc has it's own logic for all users (normal, or moderators)
  if (documentType === 'outing') {
    // outing, if user is associated
    if (isAssociatedUser(document, user)) {
      return true;
    }
  } else if (documentType === 'image') {
    // image : it must be own user personnal image. Collaborative image can't be deleted
    if (['personal', 'copyright'].includes(document.image_type ?? '') && document.creator?.user_id === user.id) {
      return true;
    }
  } else if (documentType === 'xreport') {
    // xreport : is the current user the author ?
    if (authorId(document) === user.id) {
      return true;
    }
  } else if (documentType === 'article') {
    // article : it must be personal
    if (document.article_type === 'personal' && authorId(document) === user.id) {
      return true;
    }
  }

  // finally, moderator can delete everything but profile and areas
  return documentType !== 'profile' && documentType !== 'area' && user.isModerator;
}

/** The view mode, and whether the user can edit or delete the document (with a type letter) */
export function useEditable(getDocument: () => Document & { type?: string }) {
  const globals = getCurrentInstance()!.appContext.config.globalProperties;
  const viewMode = useViewMode();
  const documentType = () => globals.$documentUtils.getDocumentType(getDocument().type);

  return {
    ...viewMode,
    isEditable: computed(() => isEditable(getDocument(), documentType(), globals.$user, viewMode.isNormalView.value)),
    isDeletable: computed(() => isDeletable(getDocument(), documentType(), globals.$user, viewMode.isNormalView.value)),
  };
}
