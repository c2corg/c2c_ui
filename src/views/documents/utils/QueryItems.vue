<template>
  <div class="query-items">
    <div class="query-items-filters">
      <query-item
        v-if="fields.title"
        :field="fields.title"
        class="title-input is-hidden-mobile query-item-component"
        hide-label
      />

      <dropdown-button
        v-for="category of categorizedFields"
        :key="category.name"
        class="query-item-component"
        :disabled="category.fields.length === 0"
      >
        <template #button>
          <span class="button is-size-7-mobile" :disabled="category.fields.length === 0">
            <fa-icon :icon="$options.categoryIcon[category.name]" />
            <span class="is-hidden-mobile">
              <!-- $gettext('General') -->
              <!-- $gettext('ratings') -->
              <!-- $gettext('Terrain') -->
              <!-- $gettext('Miscs') -->
              &nbsp;{{ $gettext(category.name) }}
            </span>
            <span v-if="category.activeCount != 0"> &nbsp;({{ category.activeCount }}) </span>
            <span>&nbsp;</span>
            <fa-icon icon="angle-down" aria-hidden="true" />
          </span>
        </template>

        <div class="sub-query-items">
          <query-item
            v-for="field of category.fields"
            :key="field.name"
            :field="field"
            class="dropdown-item"
            :class="field.name === 'title' ? 'is-hidden-tablet' : ''"
          />
        </div>
      </dropdown-button>
      <dropdown-button key="multi-search" class="query-item-component is-hidden-tablet">
        <template #button>
          <span class="button is-size-7-mobile">
            <fa-icon :icon="$options.categoryIcon['MultiSearch']" />
            <span>&nbsp;</span>
            <fa-icon icon="angle-down" aria-hidden="true" />
          </span>
        </template>
        <div class="sub-query-items">
          <association-query-item class="dropdown-item" :document-types="associations" @add="addTag" />
          <div class="query-items-tags dropdown-item">
            <query-tags :documents="tags" @remove="removeTag"></query-tags>
          </div>
        </div>
      </dropdown-button>

      <dropdown-button v-if="['route', 'waypoint'].includes(documentType)" key="transport" class="query-item-component">
        <template #button>
          <span class="button is-size-7-mobile">
            <fa-icon :icon="$options.categoryIcon['Transport']" />
            <span class="is-hidden-mobile"> &nbsp;{{ $gettext('Public transport') }} </span>
            <span v-if="transportActiveCount != 0"> &nbsp;({{ transportActiveCount }}) </span>
            <span>&nbsp;</span>
            <fa-icon icon="angle-down" aria-hidden="true" />
          </span>
        </template>
        <div class="sub-query-items">
          <div class="dropdown-item">
            <button
              v-if="transportActiveCount != 0"
              type="button"
              class="button is-small is-text transport-reset-button"
              @click="resetTransportFilter"
            >
              <fa-icon icon="undo-alt" aria-hidden="true" />
              {{ $gettext('Reset') }}
            </button>
            <transport-filter-form mode="patch" :fixed-document-type="documentType" />
          </div>
        </div>
      </dropdown-button>

      <query-sort-dropdown
        v-if="['waypoint', 'route', 'image', 'outing'].includes(documentType)"
        class="query-item-component"
      />

      <association-query-item
        class="query-item-component is-hidden-mobile"
        :document-types="associations"
        @add="addTag"
      />
      <div class="is-hidden-mobile" style="display: inline">
        <load-user-preferences-button class="is-hidden-tablet query-item-component" />
        <export-csv-button v-if="listMode" class="is-small-mobile query-item-component"></export-csv-button>
        <print-button v-show="showPrintButton" />
        <div class="query-items-tags">
          <query-tags :documents="tags" @remove="removeTag"></query-tags>
        </div>
      </div>
      <dropdown-button class="is-hidden-tablet is-pulled-right">
        <template #button>
          <span class="button is-white is-size-7-mobile">
            <fa-icon icon="ellipsis-vertical" />
          </span>
        </template>
        <div class="dropdown-items is-flex is-flex-direction-column">
          <load-user-preferences-button display="dropdown" />
          <print-button display="dropdown" v-show="showPrintButton" />
        </div>
      </dropdown-button>
    </div>
  </div>
</template>

<script>
import AssociationQueryItem from './AssociationQueryItem';
import ExportCsvButton from './ExportCsvButton.vue';
import LoadUserPreferencesButton from './LoadUserPreferencesButton';
import PrintButton from './PrintButton';
import QueryItem from './QueryItem';
import QuerySortDropdown from './QuerySortDropdown';
import QueryTags from './QueryTags';
import urlMixin from './url-mixin';

import TransportFilterForm from '@/components/itinevert/TransportFilterForm.vue';
import c2c from '@/js/apis/c2c';
import constants from '@/js/constants';
import { getPreferences } from '@/js/vue-plugins/local-storage';

const documentsCache = {};

const categorizedFields = {
  area: constants.categorizedFieldsDefault,
  article: constants.categorizedFieldsDefault,
  book: constants.categorizedFieldsDefault,
  image: constants.categorizedFieldsDefault,
  map: constants.categorizedFieldsDefault,
  outing: constants.categorizedFieldsDefault,
  profile: constants.categorizedFieldsDefault,
  route: constants.categorizedFieldsDefault,
  waypoint: constants.categorizedFieldsDefault,
  xreport: constants.categorizedFieldsDefault,
};

export default {
  categoryIcon: {
    General: 'filter',
    MultiSearch: 'filter',
    Miscs: 'database',
    Terrain: ['waypoint', 'summit'],
    ratings: 'tachometer-alt',
    Transport: 'bus',
  },

  components: {
    AssociationQueryItem,
    PrintButton,
    QueryItem,
    QuerySortDropdown,
    QueryTags,
    ExportCsvButton,
    LoadUserPreferencesButton,
    TransportFilterForm,
  },

  mixins: [urlMixin],

  props: {
    listMode: {
      type: Boolean,
      default: false,
    },
    showPrintButton: {
      type: Boolean,
      default: true,
    },
  },

  emits: ['documents-load'],

  data() {
    return {
      tags: [],
    };
  },

  computed: {
    associations() {
      if (this.documentType === 'outing') {
        return ['area', 'route', 'waypoint', 'profile'];
      }

      if (this.documentType === 'route') {
        return ['area', 'waypoint'];
      }

      if (this.documentType === 'waypoint') {
        return ['area'];
      }

      return [];
    },

    categorizedFields() {
      const result = [];

      for (const category of Object.keys(categorizedFields[this.documentType])) {
        const temp = {
          name: category,
          activeCount: 0,
          fields: [],
        };

        let addCategory = false;

        for (const name of categorizedFields[this.documentType][category]) {
          const field = this.fields[name];
          if (field !== undefined && field.url) {
            addCategory = true;

            if (this.$route.query[field.url] !== undefined) {
              temp.activeCount += 1;
            }

            if (this.fieldIsVisible(field)) {
              temp.fields.push(field);
            }
          }
        }

        if (addCategory) {
          result.push(temp);
        }
      }

      return result;
    },

    transportActiveCount() {
      return this.$route.query.reachable_ids ? 1 : 0;
    },
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
      this.tags = [];

      for (const documentType of this.associations) {
        for (const documentId of this.getValue(documentType)) {
          this.tags.push(this.getDocument(documentType, documentId));
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

    addTag(document) {
      const documentType = this.$documentUtils.getDocumentType(document.type);

      const value = this.getValue(documentType);

      if (value.includes(document.document_id)) {
        return;
      }

      value.push(document.document_id);

      this.setValue(documentType, value);
    },

    removeTag(document) {
      const documentType = this.$documentUtils.getDocumentType(document.type);
      const value = this.getValue(documentType);
      // remove
      value.splice(value.indexOf(document.document_id), 1);

      this.setValue(documentType, value);
    },

    emitDocumentsLoad() {
      this.$emit('documents-load', this.tags);
    },

    /** Clears the transport (`reachable_ids`) filter and the stashed Itinevert search context */
    resetTransportFilter() {
      const query = { ...this.$route.query };
      delete query.reachable_ids;
      this.$router.push({ query });
      getPreferences('itinevert').clear();
    },
  },
};
</script>

<style scoped lang="scss">
.query-items-filters {
  font-size: 0;

  > div {
    font-size: 1rem;
  }
}

.query-item-component {
  margin-bottom: 0.5rem;
}

.title-input {
  display: inline-flex;
  margin-bottom: 0 !important;
}

.transport-reset-button {
  margin-bottom: 0.75rem;
}

.sub-query-items {
  @media screen and (min-width: $tablet) {
    min-width: 300px;
  }

  @media screen and (max-width: $tablet) {
    overflow-y: scroll;
    overflow-x: hidden;
    /*
      max-height should be calculated:
      100vh-($navbar-height)-height(.search-infos)
      but .search-infos height is not fixed
    */
    max-height: 70vh;

    scrollbar-width: none; // Firefox

    &::-webkit-scrollbar {
      display: none; // Chrome, Safari and Opera
    }
  }
}

@media screen and (min-width: $tablet) {
  .query-item-component {
    margin-right: 0.75em;
  }
}

@media screen and (max-width: $tablet) {
  .query-item-component {
    margin-right: 0.25em;
  }

  .query-items-filters {
    position: relative; // important, to force drop down on the left
  }

  .dropdown {
    position: unset; // important, to force drop down on the left
  }
}
</style>
