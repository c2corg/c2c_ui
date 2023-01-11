<template>
  <div v-if="documentsByType.length">
    <div class="is-flex mb-4">
      <div class="control has-icons-left input-container" :class="{ 'has-icons-right': filterText.length > 2 }">
        <input
          class="input"
          type="text"
          :placeholder="$gettext('Search ...')"
          ref="textFilter"
          @input="onInput"
          @keyup.escape="clearTextFilter"
          v-model="filterText"
        />
        <span class="icon is-left">
          <fa-icon icon="search" />
        </span>
        <span class="icon is-right click" v-if="filterText.length > 2" @click="clearTextFilter">
          <fa-icon icon="circle-xmark" />
        </span>
      </div>
      <dropdown-button class="ml-4">
        <span slot="button" class="button">
          <fa-icon icon="eye" /><span class="is-hidden-mobile">&nbsp;</span
          ><span class="is-hidden-mobile" v-translate>Filter by type</span>
        </span>
        <div class="dropdown-item" v-for="t of offlineDocumentTypes" :key="t">
          <input-checkbox
            :disabled="documentsByType.every(([dt]) => dt !== t)"
            v-model="filteredTypes[t]"
            @change="filter"
          >
            {{ $gettext($documentUtils.getDocumentType(t) + 's') | uppercaseFirstLetter }}
          </input-checkbox>
        </div>
      </dropdown-button>
      <button class="button ml-4 is-danger" @click="showModal(undefined)">
        <fa-icon :icon="['far', 'trash-alt']" /><span class="is-hidden-mobile">&nbsp;</span
        ><span class="is-hidden-mobile" v-translate>Delete all</span>
      </button>
    </div>
    <div class="result-section" v-if="filteredDocumentsByType.length">
      <div v-for="[t, documents] of filteredDocumentsByType" :key="t" class="documents-container">
        <h2
          class="title is-3 has-text-centered has-background-secondary has-text-light has-rounded-corner"
          v-if="documents.length"
        >
          {{ $gettext($documentUtils.getDocumentType(t) + 's') | uppercaseFirstLetter }}
          <a @click="showModal(t)" class="delete-type has-text-white is-pulled-right mr-2">
            <fa-icon size="xs" :icon="['far', 'trash-alt']" :title="$gettext('Delete all documents of this type')" />
          </a>
        </h2>
        <div class="columns is-multiline mb-4">
          <div v-if="t === 'i'" class="mx-2">
            <image-cards :documents="{ documents }" show-delete-button @delete="remove" />
          </div>
          <template v-else>
            <div v-for="document in documents" :key="document.document_id" class="column is-4 is-3-fullhd">
              <document-card :document="document" show-delete-button @delete="remove(document)" />
            </div>
          </template>
        </div>
      </div>
    </div>
    <div v-else><p v-translate>No matching document saved for offline view. Check your filters.</p></div>

    <delete-offline-documents-modal ref="DeleteOfflineDocumentsModal" :doc-type="deleteType" @delete="clear" />
  </div>

  <div v-else>
    <p class="m-4">
      <fa-icon icon="cloud-arrow-down" size="3x" />
      <span v-translate>
        You can save a document for offline view when browsing by means of the cloud icon. It will then be available
        even when network is down.
      </span>
    </p>
  </div>
</template>

<script>
import ImageCards from '../documents/utils/ImageCards';

import DeleteOfflineDocumentsModal from './DeleteOfflineDocumentsModal';

import debounce from '@/js/debounce';

export default {
  name: 'OfflineDocuments',

  components: {
    ImageCards,
    DeleteOfflineDocumentsModal,
  },

  data() {
    return {
      documentsByType: [],
      filteredDocumentsByType: [],
      filterText: '',
      filteredTypes: {},
      deleteType: undefined,
    };
  },

  computed: {
    offlineDocumentTypes() {
      return this.$offline.getOfflineDocumentTypes();
    },
  },

  async mounted() {
    this.documentsByType = Object.entries(
      (await this.$offline.getAllDocuments()).reduce((acc, doc) => {
        if (!acc[doc.type]) {
          acc[doc.type] = [];
        }
        acc[doc.type].push(doc);
        return acc;
      }, {})
    ).sort(([k1], [k2]) => this.offlineDocumentTypes.indexOf(k1) - this.offlineDocumentTypes.indexOf(k2));
    this.filteredDocumentsByType = this.documentsByType;
    this.filteredTypes = this.offlineDocumentTypes.reduce(
      (acc, t) => ({ ...acc, [t]: this.documentsByType.some(([dt]) => dt === t) }),
      {}
    );
  },

  methods: {
    onInput: debounce(async function () {
      this.filter();
    }, 300),

    async filter() {
      const { default: Fuse } = await import(/* webpackChunkName: "offline" */ 'fuse.js');
      this.filteredDocumentsByType = this.documentsByType
        .map(([type, docs]) => {
          if (this.filterText?.length > 2) {
            const fuse = new Fuse(docs, { findAllMatches: true, keys: ['locales.title', 'locales.title_prefix'] });
            return [type, fuse.search(this.filterText).map((result) => result.item)];
          }
          return [type, docs];
        })
        .filter(([t, docs]) => this.filteredTypes[t] && docs.length);
    },

    clearTextFilter() {
      this.filterText = '';
      this.onInput();
      this.$refs.textFilter.focus();
    },

    showModal(type) {
      this.deleteType = type;
      this.$refs.DeleteOfflineDocumentsModal.show();
    },

    async remove(document) {
      await this.$offline.deleteDocument(
        this.$documentUtils.getDocumentType(document.type) + 's',
        document.document_id
      );
      const documents = this.documentsByType.find(([t]) => t === document.type)[1];
      const idx = documents.findIndex(({ document_id }) => document_id === document.document_id);
      documents.splice(idx, 1);
      this.filter();
    },

    async clear() {
      await this.$offline.clear(this.deleteType);
      if (this.deleteType) {
        this.documentsByType = this.documentsByType.filter(([t]) => t !== this.deleteType);
        this.filteredDocumentsByType = this.filteredDocumentsByType.filter(([t]) => t !== this.deleteType);
      } else {
        this.documentsByType = [];
        this.filteredDocumentsByType = [];
      }
    },
  },
};
</script>

<style scoped lang="scss">
.click {
  pointer-events: initial !important;
  cursor: pointer !important;
}

.delete-type {
  svg {
    transition: 300ms;
  }

  &:hover {
    filter: brightness(90%);
  }
}
</style>
