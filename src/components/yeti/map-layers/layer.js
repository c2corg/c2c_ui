export default {
  computed: {
    map() {
      // store parent map
      return this.$parent.map;
    },
    view() {
      return this.map.getView();
    },
  },
};
