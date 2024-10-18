export default {
  methods: {
    getLayer() {
      return this.$children[0].getLayer();
    },
    onMapClick(evt, feature) {
      return this.$children[0].onMapClick(evt, feature);
    },
    onMapLooseClick() {
      return this.$children[0].onMapLooseClick();
    },
    onMapPointerMove(evt, feature) {
      return this.$children[0].onMapPointerMove(evt, feature);
    },
    onMapLoosePointerMove() {
      return this.$children[0].onMapLoosePointerMove();
    },
  },
};
