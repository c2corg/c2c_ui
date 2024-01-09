<template>
  <modal-window ref="modalWindow">
    <div slot="header" class="has-text-centered">
      <span v-translate>Create the first version in the following lang</span>
    </div>
    <div v-for="lang in missingLangs" :key="lang" class="has-text-centered">
      <edit-link class="is-size-4" :document="document" :lang="lang">
        {{ $gettext(lang, 'langs') | uppercaseFirstLetter }}
      </edit-link>
    </div>
  </modal-window>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],

  props: {
    missingLangs: {
      type: Array,
      required: true,
    },
  },

  methods: {
    show() {
      this.$refs.modalWindow.show();
    },
  },
};
</script>
