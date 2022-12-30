<template>
  <div class="notification is-warning has-text-centered">
    <p v-translate>You are trying to view a masked version of a document.</p>
    <p>
      <span v-if="!isFirstVersion">
        <version-link
          :document-type="documentType"
          :id="$route.params.id"
          :lang="$route.params.lang"
          :version="version.previous_version_id"
        >
          ←
          <span v-translate>previous version</span>
        </version-link>
      </span>
      <span v-else v-translate>This is the first version</span>
      |
      <span v-if="!isLastVersion">
        <version-link
          :document-type="documentType"
          :id="$route.params.id"
          :lang="$route.params.lang"
          :version="version.next_version_id"
        >
          <span v-translate>next version</span>
          →
        </version-link>
      </span>
      <span v-else v-translate>This is the last version</span>
    </p>
  </div>
</template>

<script>
export default {
  props: {
    version: {
      type: Object,
      required: true,
    },
    documentType: {
      type: String,
      required: true,
    },
  },

  computed: {
    isFirstVersion() {
      return !this.version.previous_version_id;
    },
    isLastVersion() {
      return !this.version.next_version_id;
    },
  },
};
</script>
