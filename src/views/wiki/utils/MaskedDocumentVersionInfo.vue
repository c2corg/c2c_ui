<template>
  <div class="notification is-warning has-text-centered">
    <p v-translate>You are trying to compare versions of a document of which at least one version is masked.</p>
    <router-link
      :to="{ name: documentType + '-history', params: { id: $route.params.id, lang: $route.params.lang } }"
      rel="nofollow"
      v-translate
    >
      Show document history
    </router-link>
  </div>
</template>

<script>
export default {
  props: {
    documentType: {
      type: String,
      required: true,
    },
  },
};
</script>
