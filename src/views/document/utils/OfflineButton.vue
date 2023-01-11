<template>
  <a v-if="canSave" @click="onClick" :title="tooltip" :class="{ active: availableOffline }">
    <icon-offline></icon-offline>
  </a>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],

  data() {
    return {
      availableOffline: false,
    };
  },

  computed: {
    canSave() {
      return this.$offline.getOfflineDocumentTypes().includes(this.document.type);
    },

    tooltip() {
      if (this.availableOffline) {
        return this.$gettext('Remove from offline cache');
      } else {
        return this.$gettext('Save for offline view');
      }
    },
  },

  async mounted() {
    this.availableOffline = !!(await this.$offline.getDocument(
      this.$documentUtils.getDocumentType(this.document.type) + 's',
      this.document.document_id,
      this.document.cooked.lang
    ));
  },

  methods: {
    async onClick() {
      if (this.availableOffline) {
        await this.$offline.deleteDocument(
          this.$documentUtils.getDocumentType(this.document.type) + 's',
          this.document.document_id,
          this.document.cooked.lang
        );
      } else {
        await this.$offline.setDocument(
          this.$documentUtils.getDocumentType(this.document.type) + 's',
          this.document.document_id,
          this.document.cooked.lang,
          this.document
        );
      }
      this.availableOffline = !this.availableOffline;
    },
  },
};
</script>

<style scoped lang="scss">
.active {
  color: $yellow !important;
}
</style>
