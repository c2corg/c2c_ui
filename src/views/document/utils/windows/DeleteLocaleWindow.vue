<template>
  <modal-confirmation ref="modalWindow" show-uncancelable-warning :promise="promise" @confirm="executeDelete">
    <template #title>
      <span v-translate>Delete this locale</span>
    </template>

    <span v-translate>Are you sure you want to delete this locale?</span>
  </modal-confirmation>
</template>

<script>
import c2c from '@/js/apis/c2c';
import { documentProperty, useDocumentType } from '@/js/properties';

export default {
  props: {
    ...documentProperty,
    localeLang: {
      type: String,
      required: true,
    },
  },

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
      this.promise = c2c.moderator.deleteLocale(this.document.document_id, this.localeLang).then(() => {
        this.$router.push({ name: this.documentType, id: this.document.document_id });
      });
    },
  },
};
</script>
