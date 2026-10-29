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
          <span class="button is-size-7-mobile" :disabled="category.fields.length === 0 || null">
            <fa-icon :icon="categoryIcon[category.name]" />
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
            <fa-icon :icon="categoryIcon['MultiSearch']" />
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

<script lang="ts">
// a document of the association filters, loaded once for all the lists (<script setup> runs per instance)
type CachedDocument = { document_id: number; type?: string; loading: boolean; [property: string]: unknown };
const documentsCache: Record<string, CachedDocument> = {};
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';

import AssociationQueryItem from './AssociationQueryItem.vue';
import ExportCsvButton from './ExportCsvButton.vue';
import LoadUserPreferencesButton from './LoadUserPreferencesButton.vue';
import PrintButton from './PrintButton.vue';
import QueryItem from './QueryItem.vue';
import QuerySortDropdown from './QuerySortDropdown.vue';
import QueryTags from './QueryTags.vue';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { useUrlFilters } from '@/js/composables/url-filters';
import constants from '@/js/constants';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

// the fields of each document type, per category
const fieldsByCategory: Record<string, Record<string, string[]>> = {
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

const categoryIcon: Record<string, string | string[]> = {
  General: 'filter',
  MultiSearch: 'filter',
  Miscs: 'database',
  Terrain: ['waypoint', 'summit'],
  ratings: 'tachometer-alt',
};

defineProps({
  listMode: {
    type: Boolean,
    default: false,
  },
  showPrintButton: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['documents-load']);

const route = useRoute();
const router = useRouter();
const { $documentUtils } = useGlobalProperties();
const { documentType, fields, fieldIsVisible } = useUrlFilters();

const tags = ref<CachedDocument[]>([]);

const associations = computed(() => {
  if (documentType.value === 'outing') {
    return ['area', 'route', 'waypoint', 'profile'];
  }

  if (documentType.value === 'route') {
    return ['area', 'waypoint'];
  }

  if (documentType.value === 'waypoint') {
    return ['area'];
  }

  return [];
});

const categorizedFields = computed(() => {
  const result = [];

  for (const category of Object.keys(fieldsByCategory[documentType.value])) {
    const temp = {
      name: category,
      activeCount: 0,
      fields: [] as (typeof fields.value)[string][],
    };

    let addCategory = false;

    for (const name of fieldsByCategory[documentType.value][category]) {
      const field = fields.value[name];
      if (field !== undefined && field.url) {
        addCategory = true;

        if (route.query[field.url] !== undefined) {
          temp.activeCount += 1;
        }

        if (fieldIsVisible(field)) {
          temp.fields.push(field);
        }
      }
    }

    if (addCategory) {
      result.push(temp);
    }
  }

  return result;
});

function getUrlValue(documentType: string) {
  const key = constants.objectDefinitions[documentType].letter;

  return route.query[key];
}

function setUrlValue(documentType: string, value: string) {
  const key = constants.objectDefinitions[documentType].letter;

  const query: LocationQueryRaw = Object.assign({}, route.query);
  query[key] = value === '' ? undefined : value;

  if (query[key] !== route.query[key]) {
    router.push({ query });
  }
}

function getValue(documentType: string) {
  const urlValue = getUrlValue(documentType);

  return urlValue
    ? String(urlValue)
        .split(',')
        .map((num) => parseInt(num, 10))
    : [];
}

function setValue(documentType: string, value: number[]) {
  setUrlValue(documentType, value.join(','));
}

function load() {
  tags.value = [];

  for (const documentType of associations.value) {
    for (const documentId of getValue(documentType)) {
      tags.value.push(getDocument(documentType, documentId));
    }
  }

  emitDocumentsLoad();
}

function getDocument(documentType: string, documentId: number) {
  const key = `${documentType}#${documentId}`;

  if (documentsCache[key] === undefined) {
    documentsCache[key] = {
      document_id: documentId,
      loading: true,
    };

    (c2c as unknown as Record<string, DocumentService>)[documentType].get(documentId).then((response) => {
      documentsCache[key].loading = false;
      Object.assign(documentsCache[key], response.data);
      emitDocumentsLoad();
    });
  }

  return documentsCache[key];
}

function addTag(document: C2cDocument) {
  const documentType = $documentUtils.getDocumentType(document.type);

  const value = getValue(documentType);

  if (value.includes(document.document_id!)) {
    return;
  }

  value.push(document.document_id!);

  setValue(documentType, value);
}

function removeTag(document: C2cDocument) {
  const documentType = $documentUtils.getDocumentType(document.type);
  const value = getValue(documentType);
  // remove
  value.splice(value.indexOf(document.document_id!), 1);

  setValue(documentType, value);
}

function emitDocumentsLoad() {
  emit('documents-load', tags.value);
}

watch(() => route.fullPath, load, { immediate: true });
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
