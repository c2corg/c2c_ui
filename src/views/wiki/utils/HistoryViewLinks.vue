<template>
  <div class="links">
    <diff-link
      :document-type="documentType"
      :id="documentId"
      :lang="lang"
      :version-from="versionFrom"
      :version-to="versionTo"
      v-translate
    >
      Compare selected versions
    </diff-link>
    <router-link :to="{ name: documentType, params: { id: documentId, lang: lang } }" v-translate>
      See the latest version
    </router-link>
    <association-history-link :document-id="documentId" v-translate>Associations history</association-history-link>
    <span>
      <span v-translate>List of versions for language:</span>
      <span> &nbsp;{{ $gettext(lang, 'langs') }} </span>
    </span>
  </div>
</template>

<script>
export default {
  props: {
    documentId: {
      type: Number,
      required: true,
    },
    documentType: {
      type: String,
      required: true,
    },
    lang: {
      type: String,
      required: true,
    },
    versionFrom: {
      type: Number,
      required: true,
    },
    versionTo: {
      type: Number,
      required: true,
    },
  },
};
</script>

<style scoped lang="scss">
.links a:after {
  content: '\0000a0\002022\0000a0'; //&nbsp;&bull;&nbsp;
  color: $text;
}
</style>
