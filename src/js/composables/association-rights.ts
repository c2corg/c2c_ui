// Whether the user can associate a document to another, or remove their association, in the edit forms
import { getCurrentInstance } from 'vue';

type Document = {
  document_id?: number;
  type?: string;
  waypoint_type?: string | null;
  article_type?: string | null;
  author?: { user_id: number } | string | null;
  associations?: Record<string, unknown>;
};

type User = { readonly isModerator: boolean; id: number | null };

export function canAdd(parent: Document, child: Document, user: User, forbiddenChildren?: Document[] | null): boolean {
  // technical limitation : for waypoint/waypoint associations, link can't be both ways
  if (forbiddenChildren?.some((forbidden) => forbidden.document_id === child.document_id)) {
    return false;
  }

  // can't associate a document to itself
  if (parent.document_id === child.document_id) {
    return false;
  }

  // cannot associated routes to climbing indoor
  if (parent.type === 'r' && child.type === 'w' && child.waypoint_type === 'climbing_indoor') {
    return false; // TODO API: climbing indoor cannot be associated to routes
  }

  // moderator can always add
  if (user.isModerator) {
    return true;
  }

  /*
   * rules for standard users. Do not forget that if he can open this page, he can edit parent
   */

  // only moderator can add waypoint/waypoint association
  if (parent.type === 'w' && child.type === 'w') {
    return false;
  }

  if (child.type === 'a' && child.article_type === 'personal') {
    return false; // TODO API: if user is article owner, he can => add author in response
  }

  if (child.type === 'x') {
    return false; // TODO API: if user is xreport owner, he can => add author in response
  }

  if (child.type === 'i') {
    return true; // TODO API: add image_type (collab), and author
  }

  return true;
}

// the association lists of a document (not the pages of recent outings or all routes)
const LISTS = [
  'waypoints',
  'waypoint_children',
  'routes',
  'outings',
  'images',
  'articles',
  'books',
  'xreports',
  'users',
];

/** How many documents a document is associated to, from its association lists */
export function associatedCount(document: Document): number {
  return LISTS.reduce((count, list) => {
    const documents = document.associations?.[list];
    return count + (Array.isArray(documents) ? documents.length : 0);
  }, 0);
}

export type RemovalBlock = 'last_route' | 'last_user' | 'last_document_of_image';

/**
 * Whether a rule of the API refuses to remove an association, for everyone, moderators included: an outing keeps a
 * route and a user, an image a document. `imageCounts`: how many documents the images listed are associated to, when
 * known (read when the association editor opens).
 */
export function removalBlock(
  parent: Document,
  child: Document,
  imageCounts: Record<number, number> = {}
): RemovalBlock | null {
  const list = (name: string) => {
    const documents = parent.associations?.[name];
    return Array.isArray(documents) ? documents : undefined;
  };
  if (parent.type === 'o' && child.type === 'r' && (list('routes')?.length ?? 2) <= 1) {
    return 'last_route';
  }
  if (parent.type === 'o' && child.type === 'u' && (list('users')?.length ?? 2) <= 1) {
    return 'last_user';
  }
  // the image of the page, linked to this document only
  if (parent.type === 'i' && associatedCount(parent) <= 1) {
    return 'last_document_of_image';
  }
  // an image listed, linked to this document only
  if (child.type === 'i' && child.document_id !== undefined && imageCounts[child.document_id] === 1) {
    return 'last_document_of_image';
  }
  return null;
}

export function canRemove(parent: Document, child: Document, user: User): boolean {
  // moderator can always remove (but what a rule of the API refuses for everyone, see removalBlock)
  if (user.isModerator) {
    return true;
  }

  /*
   * rules for standard user. Do not forget that if he can open this page, he can edit parent
   */

  // if it's an outing, user can do whatever he wants, except remove itself
  if (parent.type === 'o') {
    return child.document_id !== user.id;
  }

  // if parent document is user own profile: can always remove
  if (parent.document_id === user.id) {
    return true;
  }

  if (child.type === 'a' && child.article_type === 'personal') {
    return false; // TODO API : if user is article owner, he can => add author in response
  }

  if (child.type === 'x') {
    return false; // TODO API : if user is xreport owner, he can => add author in response
  }

  if (child.type === 'i') {
    return false; // TODO API : add image_type (collab), and author
  }

  if (child.type === 'o') {
    return typeof child.author === 'object' && child.author?.user_id === user.id;
  }

  return false;
}

// for the current user ($user, read when called)
export function useAssociationRights() {
  const globals = getCurrentInstance()!.appContext.config.globalProperties;

  return {
    canAdd: (parent: Document, child: Document, forbiddenChildren?: Document[] | null) =>
      canAdd(parent, child, globals.$user, forbiddenChildren),
    canRemove: (parent: Document, child: Document) => canRemove(parent, child, globals.$user),
    removalBlock,
  };
}
