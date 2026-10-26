// Whether the user can associate a document to another, or remove their association, in the edit forms
import { getCurrentInstance } from 'vue';

type Document = {
  document_id?: number;
  type?: string;
  waypoint_type?: string | null;
  article_type?: string;
  author?: { user_id: number };
  associations?: { routes?: unknown[] };
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

export function canRemove(parent: Document, child: Document, user: User): boolean {
  // technical limitation : an outing must have at least one route
  const routes = parent.associations?.routes;
  if (parent.type === 'o' && child.type === 'r' && routes !== undefined && routes.length <= 1) {
    return false;
  }

  // otherwise, moderator can always remove
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
    return child.author?.user_id === user.id;
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
  };
}
