export default {
  props: {
    forbiddenChildren: {
      type: Array,
      default: null,
    },
  },

  methods: {
    canAdd(parent, child, forbiddenChildren = []) {
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
      if (this.$user.isModerator) {
        return true;
      }

      /**********************************
      /* rules for standard users. Do not forget that if he can open this page, he can edit parent
      /**********************************/

      // only moderator can add waypoint/waypoint association
      if (parent.type === 'w' && child.type === 'w') {
        return false;
      }

      if (child.type === 'a' && child.article_type === 'personal') {
        return false; // TODO API : if user is article owner, he can => add author in response
      }

      if (child.type === 'x') {
        return false; // TODO API : if user is xreport owner, he can => add author in response
      }

      if (child.type === 'i') {
        return true; // TODO API : add image_type (collab), and author
      }

      return true;
    },

    canRemove(parent, child) {
      // technical limitation : an outing must have at least one route
      if (parent.type === 'o' && child.type === 'r' && parent.associations.routes?.length <= 1) {
        return false;
      }

      // otherwise, moderator can always remove
      if (this.$user.isModerator) {
        return true;
      }

      /**********************************
      / rules for standard user. Do not forget that if he can open this page, he can edit parent
      /**********************************/

      // if it's an outing, user can do whatever he wants, except remove itself
      if (parent.type === 'o') {
        return child.document_id !== this.$user.id;
      }

      // if parent document is user own profile: can always remove
      if (parent.document_id === this.$user.id) {
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
        return child.author.user_id === this.$user.id;
      }

      return false;
    },
  },
};
