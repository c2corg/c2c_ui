<script lang="ts">
import { defineComponent, watch } from 'vue';

import { environmentLabel } from '@/js/environment-label';

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
        const pageTitle =
          title !== 'Camptocamp.org' ? capitalizeFirstLetter(title) + ' - Camptocamp.org' : 'Camptocamp.org';
        document.title = environmentLabel ? `[${environmentLabel.toUpperCase()}] ${pageTitle}` : pageTitle;
      },
      { immediate: true }
    );

    return () => null;
  },
});
</script>
