// isEditable and isDeletable, for the components that still use the Options API (DocumentViewHeader, ToolBox): from
// their document and documentType properties. The rules are in composables/editable.ts
import { isDeletable, isEditable } from '@/js/composables/editable';
import viewModeMixin from '@/js/view-mode-mixin';

export default {
  mixins: [viewModeMixin],

  computed: {
    isDeletable() {
      return isDeletable(this.document, this.documentType, this.$user, this.isNormalView);
    },

    isEditable() {
      return isEditable(this.document, this.documentType, this.$user, this.isNormalView);
    },
  },
};
