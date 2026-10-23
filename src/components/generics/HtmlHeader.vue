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

  // no DOM: it only sets document.title
  render() {
    return null;
  },
};
</script>
