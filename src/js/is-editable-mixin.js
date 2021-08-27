// The purpose of this mixin is to expose isDeletable and isEditable properties
// It relies onthe presence of document and documentType properties
//
// As you can see, knowing if a document is editable is quite complex
// Note : if user is not logged, we continue the process, as we want to display
// edit button even for anonymous users

import viewModeMixin from '@/js/view-mode-mixin';

export default {
  mixins: [viewModeMixin],

  computed: {
    isDeletable() {
      // first of all, if it's not editable, you can't delete it.
      if (!this.isEditable) {
        return false;
      }

      // note that some code is quite redundant, as isEditable will do most part of the job.
      // But as rules may changes, it's way more safe to explicitly write this rules

      // Each type of doc has it's own logic for all users (normal, or moderators)
      if (this.documentType === 'outing') {
        // outing, if user is associated
        for (const user of this.document.associations.users) {
          if (user.document_id === this.$user.id) {
            return true;
          }
        }
      } else if (this.documentType === 'image') {
        // image : it must be own user personnal image. Collaborative image can't be deleted
        if (
          ['personal', 'copyright'].includes(this.document.image_type) &&
          this.document.creator.user_id === this.$user.id
        ) {
          return true;
        }
      } else if (this.documentType === 'xreport') {
        // xreport : is the current user the author ?
        if (this.document.author.user_id === this.$user.id) {
          return true;
        }
      } else if (this.documentType === 'article') {
        // article : it must be personal
        if (this.document.article_type === 'personal' && this.document.author.user_id === this.$user.id) {
          return true;
        }
      }

      // finally, moderator can delete everything but profile and areas
      if (this.documentType !== 'profile' && this.documentType !== 'area' && this.$user.isModerator) {
        return true;
      }

      // all other cas : no
      return false;
    },

    isEditable() {
      // We do not check if the user is logged. If he's not, he can login
      if (!this.isNormalView) {
        return false;
      }

      if (this.$user.isModerator) {
        return true;
      }

      if (this.document.protected) {
        return false;
      }

      if (['route', 'waypoint', 'area', 'book', 'map'].includes(this.documentType)) {
        return true;
      }

      if (this.documentType === 'profile') {
        return this.document.document_id === this.$user.id;
      }

      if (this.documentType === 'article') {
        if (this.document.article_type === 'collab') {
          return true;
        }

        return this.document.author.user_id === this.$user.id;
      }

      if (this.documentType === 'xreport') {
        if (this.document.author.user_id === this.$user.id) {
          return true;
        }

        for (const user of this.document.associations.users) {
          if (user.document_id === this.$user.id) {
            return true;
          }
        }

        return false;
      }

      if (this.documentType === 'outing') {
        for (const user of this.document.associations.users) {
          if (user.document_id === this.$user.id) {
            return true;
          }
        }

        return false;
      }

      if (this.documentType === 'image') {
        if (this.document.image_type === 'collaborative') {
          return true;
        } else if (['personal', 'copyright'].includes(this.document.image_type)) {
          return this.document.creator.user_id === this.$user.id;
        } else {
          throw new Error(`Unexpected image_type : ${this.document.image_type}`);
        }
      }

      return false;
    },
  },
};
