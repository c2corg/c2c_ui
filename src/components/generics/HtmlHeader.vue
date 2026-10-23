<script>
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default {
  props: {
    title: {
      type: String,
      required: true,
    },
  },
  watch: {
    title: {
      handler() {
        document.title =
          this.title !== 'Camptocamp.org' ? capitalizeFirstLetter(this.title) + ' - Camptocamp.org' : 'Camptocamp.org';
      },
      immediate: true,
    },
  },

  // no DOM: it only sets document.title (a Vue 3 render function, without the h argument of Vue 2)
  compatConfig: { RENDER_FUNCTION: false },
  render() {
    return null;
  },
};
</script>
