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
  methods: {
    getExtent(projection) {
      return this.$parent.getExtent(projection);
    },
  },
};
