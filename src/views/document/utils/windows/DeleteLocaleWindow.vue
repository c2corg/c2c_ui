<template>
  <modal-confirmation ref="modalWindow" show-uncancelable-warning :promise="promise" @confirm="executeDelete">
    <span slot="title" v-translate>Delete this locale</span>

    <span v-translate>Are you sure you want to delete this locale?</span>
  </modal-confirmation>
</template>

<script>
import c2c from '@/js/apis/c2c';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],

  props: {
    localeLang: {
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

    executeDelete() {
      this.promise = c2c.moderator.deleteLocale(this.document.document_id, this.localeLang).then(() => {
        this.$router.push({ name: this.documentType, id: this.document.document_id });
      });
    },
  },
};
</script>
