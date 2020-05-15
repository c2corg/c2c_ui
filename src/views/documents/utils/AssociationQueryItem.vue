<template>
  <span v-if="documentTypes.length != 0">
    <input-document
      class="input-document"
      :document-type="documentTypes"
      @add="add"
      :placeholder="$gettext('Multi-criteria search')"
    />

    <span v-for="document of documents" :key="document.document_id" class="tag is-primary is-medium">
      <span v-if="document.loading">
        {{ document.document_id }}
      </span>
      <document-title v-else :document="document" />
      <button @click="remove(document)" class="delete is-small" />
    </span>
  </span>
</template>

<script>
import c2c from '@/js/apis/c2c';
import constants from '@/js/constants';
import mixin from './query-item-mixin.js';

const documentsCache = {};

export default {
  mixins: [mixin],

  props: {
    documentTypes: {
      type: Array,
      required: true,
    },
  },

  data() {
    return {
      documents: null,
    };
  },

  watch: {
    $route: {
      handler: 'load',
      immediate: true,
    },
  },

  methods: {
    getUrlValue(documentType) {
      const key = constants.objectDefinitions[documentType].letter;

      return this.$route.query[key];
    },
    setUrlValue(documentType, value) {
      const key = constants.objectDefinitions[documentType].letter;

      const query = Object.assign({}, this.$route.query);
      query[key] = value === '' ? undefined : value;

      if (query[key] !== this.$route.query[key]) {
        this.$router.push({ query });
      }
    },

    getValue(documentType) {
      const urlValue = this.getUrlValue(documentType);

      return urlValue
        ? String(urlValue)
            .split(',')
            .map((num) => parseInt(num, 10))
        : [];
    },

    setValue(documentType, value) {
      this.setUrlValue(documentType, value.join(','));
    },

    load() {
      this.documents = [];

      for (const documentType of this.documentTypes) {
        for (const documentId of this.getValue(documentType)) {
          this.documents.push(this.getDocument(documentType, documentId));
        }
      }

      this.emitDocumentsLoad();
    },

    getDocument(documentType, documentId) {
      const key = `${documentType}#${documentId}`;

      if (documentsCache[key] === undefined) {
        documentsCache[key] = {
          document_id: documentId,
          loading: true,
        };

        c2c[documentType].get(documentId).then((response) => {
          documentsCache[key].loading = false;
          Object.assign(documentsCache[key], response.data);
          this.emitDocumentsLoad();
        });
      }

      return documentsCache[key];
    },

    add(document) {
      const documentType = this.$documentUtils.getDocumentType(document.type);

      const value = this.getValue(documentType);

      if (value.includes(document.document_id)) {
        return;
      }

      value.push(document.document_id);

      this.setValue(documentType, value);
    },

    remove(document) {
      const documentType = this.$documentUtils.getDocumentType(document.type);
      const value = this.getValue(documentType);
      // remove
      value.splice(value.indexOf(document.document_id), 1);

      this.setValue(documentType, value);
    },

    emitDocumentsLoad() {
      this.$emit('documents-load', this.documents);
    },
  },
};
</script>

<style scoped>
.input-document {
  margin-right: 1rem;
}

.tag:not(:last-child) {
  margin-right: 0.5rem;
}
</style>
