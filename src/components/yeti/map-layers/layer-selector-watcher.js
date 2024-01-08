export default {
  watch: {
    layerSelector: {
      handler(layer) {
        this.$emit('layer', layer);
      },
      deep: true,
    },
  },
};
