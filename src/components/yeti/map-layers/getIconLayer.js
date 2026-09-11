export default {
  methods: {
    getLayer() {
      return this.$refs.iconLayer.getLayer();
    },
    onMapClick(evt, feature) {
      return this.$refs.iconLayer.onMapClick(evt, feature);
    },
    onMapLooseClick() {
      return this.$refs.iconLayer.onMapLooseClick();
    },
    onMapPointerMove(evt, feature) {
      return this.$refs.iconLayer.onMapPointerMove(evt, feature);
    },
    onMapLoosePointerMove() {
      return this.$refs.iconLayer.onMapLoosePointerMove();
    },
  },
};
