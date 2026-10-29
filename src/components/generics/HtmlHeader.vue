<script lang="ts">
import { defineComponent, watch } from 'vue';

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// no DOM: it only sets document.title (a render function, as a <script setup> component would render a comment)
export default defineComponent({
  props: {
    title: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    watch(
      () => props.title,
      (title) => {
        document.title =
          title !== 'Camptocamp.org' ? capitalizeFirstLetter(title) + ' - Camptocamp.org' : 'Camptocamp.org';
      },
      { immediate: true }
    );

    return () => null;
  },
});
</script>
