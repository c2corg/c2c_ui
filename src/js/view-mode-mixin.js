// for the mixins that include it (document-view-mixin, is-editable-mixin): the components use useViewMode()
import { viewMode } from '@/js/composables/view-mode';

export default {
  computed: {
    isVersionView() {
      return viewMode(this.$route.name).isVersionView;
    },

    isDraftView() {
      // means preview for edit and add mode
      return viewMode(this.$route.name).isDraftView;
    },

    isPrintingView() {
      // means in a list of document to print
      return viewMode(this.$route.name).isPrintingView;
    },

    isNormalView() {
      return viewMode(this.$route.name).isNormalView;
    },
  },
};
