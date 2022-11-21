<template>
  <div v-if="documents" class="box">
    <h1 class="title is-1">Summary</h1>
    <div v-for="(document, index) in documents.documents" :key="index">
      <span class="toc-entry" @click="sendSummaryClick(index)">
        <span class="toc-number">{{ index + 1 }}. </span>
        <pretty-route :route="document" v-if="documentType == 'route'" />
        <pretty-waypoint :waypoint="document" v-else-if="documentType == 'waypoint'" />
        <pretty-book :book="document" v-else-if="documentType == 'book'" />
        <pretty-outing :outing="document" v-else-if="documentType == 'outing'" />
        <document-title :document="document" v-else />
      </span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    documents: {
      type: Object,
      default: null,
    },
    promises: {
      type: Array,
      default: null,
    },
    documentType: {
      type: String,
      default: 'route',
    },
  },

  methods: {
    sendSummaryClick(index) {
      this.$emit("summary-click", index);
    }
  },
};
</script>

<style scoped>
.toc-number {
  margin-right: 7px;
}
.toc-entry {
  cursor: pointer;
}
</style>
