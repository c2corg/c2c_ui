<template>
  <modal-confirmation ref="modalWindow" :promise="promise" @confirm="restoreVersion">
    <template #title>
      <span>
        <span v-translate>Restore this version</span>
      </span>
    </template>
    <span v-translate>Are you sure you want to revert to this version of the document?</span>
  </modal-confirmation>
</template>

<script>
import c2c from '@/js/apis/c2c';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],

  props: {
    lang: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      promise: null,
    };
  },

  methods: {
    show() {
      this.$refs.modalWindow.show();
    },

    restoreVersion() {
      this.promise = c2c.moderator
        .revertDocument(this.document.document_id, this.lang, this.$route.params.version)
        .then(() => {
          this.$refs.modalWindow.hide();
          this.$router.push({ name: this.documentType, id: this.document.document_id });
        });
    },
  },
};
</script>
