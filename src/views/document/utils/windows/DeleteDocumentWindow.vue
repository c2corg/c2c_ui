<template>
  <modal-confirmation ref="modalWindow" show-uncancelable-warning :promise="promise" @confirm="executeDelete">
    <template #title>
      <span v-translate>Delete this document</span>
    </template>

    <span v-translate>Are you sure you want to delete this document?</span>
  </modal-confirmation>
</template>

<script>
import c2c from '@/js/apis/c2c';
import { documentProperty, useDocumentType } from '@/js/properties';

export default {
  props: { ...documentProperty },

  setup(props) {
    return useDocumentType(props);
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

    executeDelete() {
      this.promise = c2c.moderator.deleteDocument(this.document.document_id).then(() => {
        this.$router.push({ name: this.documentType + 's' });
      });
    },
  },
};
</script>
