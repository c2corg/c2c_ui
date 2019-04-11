import viewModeMixin from './view-mode-mixin';

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
        if (['personal', 'copyright'].includes(this.document.image_type) && this.document.creator.user_id === this.$user.id) {
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
      if (!this.$user.isLogged || !this.isNormalView) {
        return false;
      }

      if (this.$user.isModerator) {
        return true;
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

      if (['outing', 'xreport'].includes(this.documentType)) {
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
    }
  }
};
