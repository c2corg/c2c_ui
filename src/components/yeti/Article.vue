<template>
  <div class="yeti-article" v-if="document">
    <sub-panel-title>{{ title }}</sub-panel-title>
    <markdown-section :document="document" :field="fields.description" hide-title></markdown-section>
  </div>
</template>

<script>
import SubPanelTitle from '@/components/yeti/SubPanelTitle.vue';
import c2c from '@/js/apis/c2c';
import constants from '@/js/constants';
import MarkdownSection from '@/views/document/utils/field-viewers/MarkdownSection';

export default {
  components: {
    SubPanelTitle,
    MarkdownSection,
  },
  props: {
    article: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      promise: null,
    };
  },
  computed: {
    id() {
      return this.article.id;
    },
    title() {
      return this.article.title;
    },
    document() {
      return this.promise?.data ?? null;
    },
    fields() {
      return constants.objectDefinitions.article.fields;
    },
    lang() {
      return this.$language.current;
    },
  },
  watch: {
    lang() {
      this.cookDocument();
    },
  },
  mounted() {
    this.cookDocument();
  },
  methods: {
    cookDocument() {
      // get document, and set promise only in then (no FOIT)
      c2c.article.getCooked(this.id, this.$language.current).then((result) => {
        this.promise = result;
      });
    },
  },
};
</script>

<style scoped lang="scss">
.yeti-article {
  max-width: 1039px;
  margin-top: 1.75em;
}
:deep(h3) {
  margin-top: 2em;
}
:deep(p) {
  margin: 1em 0;
}
:deep(ul) {
  list-style-type: disc;
}
:deep(figure) img {
  max-width: 90%;
  max-height: 500px;
}
.yeti-article--disclaimer :deep(li) {
  margin: 2em 0;
}
</style>
