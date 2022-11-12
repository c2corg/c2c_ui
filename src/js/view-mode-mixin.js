export default {
  computed: {
    isVersionView() {
      return this.$route.name.endsWith('-version');
    },

    isDraftView() {
      // means preview for edit and add mode
      return this.$route.name.endsWith('-edit') || this.$route.name.endsWith('-add');
    },

    isPrintingView() {
      // means in a list of document to print
      return this.$route.name.endsWith('-print');
    },

    isNormalView() {
      return !this.isDraftView && !this.isVersionView && !this.isPrintingView;
    },
  },
};
