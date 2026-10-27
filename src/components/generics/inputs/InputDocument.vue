<template>
  <div ref="root" class="dropdown control" :class="{ 'is-active': promise.data }">
    <div class="control has-icons-left input-container">
      <input
        ref="input"
        class="input"
        :class="{ 'is-danger': hasError, 'is-small': isSmall }"
        type="text"
        :placeholder="placeholder || $gettext('Search ...')"
        @input="onInput"
        @focus="onInput"
        v-model="searchText"
      />
      <span class="icon is-left">
        <fa-icon icon="search" />
      </span>
    </div>
    <div class="dropdown-menu" role="menu" v-if="promise.data && showOptions">
      <div class="dropdown-content">
        <div v-for="type of documentTypesWithResults" :key="type">
          <div v-if="documentTypes_.length > 1" class="dropdown-item has-text-weight-bold is-size-5">
            <!-- if several type are requested, add an header -->
            {{ $filters.uppercaseFirstLetter($gettext(type + 's')) }}
          </div>
          <div
            v-for="document of promise.data[type + 's']!.documents"
            :key="document.document_id"
            @mousedown="toggle(document)"
            class="dropdown-item dropdown-item-option columns is-gapless has-cursor-pointer"
          >
            <div v-if="isSelected(document)" class="column has-text-success is-size-1 is-narrow">
              <fa-icon icon="check-circle" />
            </div>

            <div class="column is-size-6">
              <document-title :document="document" />
              <br />
              <span v-if="document.elevation || document.elevation_max">
                <span :title="$gettext('elevation_max')">
                  <fa-icon icon="sort-amount-up" class="has-text-primary" />
                </span>
                {{ document.elevation || document.elevation_max }}&nbsp;m
              </span>

              <span v-if="document.height_diff_up">
                <icon-height-diff-up class="has-text-primary" />
                {{ document.height_diff_up }}&nbsp;m
              </span>
              <span v-if="document.forum_username" class="is-italic"> @{{ document.forum_username }} </span>
              <span v-if="document.area_type" class="is-italic">
                {{ $filters.uppercaseFirstLetter($gettext(document.area_type, 'area_types')) }}
              </span>

              &nbsp;
            </div>

            <div class="column has-text-primary is-size-2 is-narrow">
              <icon-document v-if="document.type == 'u'" document-type="profile" />
              <icon-document v-else-if="document.type == 'a'" document-type="area" />
              <activities v-else-if="document.activities" :activities="document.activities" />
              <icon-waypoint-type v-else-if="document.waypoint_type" :waypoint-type="document.waypoint_type" />
            </div>
          </div>
          <router-link
            v-if="showMoreResultsLink"
            :to="{ name: type + 's', query: { q: searchText } }"
            class="dropdown-item is-italic has-text-centered"
            @click="closeDropdown"
            v-translate
          >
            See more results
          </router-link>
        </div>

        <div v-if="proposeCreation">
          <hr v-if="documentTypesWithResults.length > 0" class="dropdown-divider" />
          <div class="dropdown-item has-text-weight-bold is-size-5" v-translate>No match?</div>
          <add-link
            v-for="type of documentTypes_"
            :key="type + '_add'"
            :document-type="type"
            class="dropdown-item dropdown-item-option is-size-6"
          />
        </div>

        <div v-else-if="documentTypesWithResults.length == 0" class="dropdown-item is-size-6" v-translate>
          No result found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useTemplateRef } from 'vue';

import { arrayInputProps, baseInputProps } from './input-value';

import c2c from '@/js/apis/c2c';
import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';
import debounce from '@/js/debounce';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type SearchResults = Record<string, { documents: C2cDocument[] } | undefined>;

const props = defineProps({
  ...baseInputProps,
  ...arrayInputProps,
  modelValue: {
    type: [Array, Object],
    default: null,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  documentType: {
    type: [Array, String],
    required: true,
  },
  proposeCreation: {
    type: Boolean,
    default: false,
  },
  showMoreResultsLink: {
    type: Boolean,
    default: false,
  },
  showOptions: {
    type: Boolean,
    default: true,
  },
  isSmall: {
    type: Boolean,
    default: false,
  },
  clearInputOnToggle: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['add', 'update:modelValue', 'load-options']);

const { $documentUtils, $language } = useGlobalProperties();

const searchText = ref('');
const promise = ref<{ data?: SearchResults | null }>({});
const input = useTemplateRef<HTMLInputElement>('input');
const rootElement = useTemplateRef<HTMLElement>('root');

const value_ = computed({
  get: () => (props.multiple ? (props.modelValue ?? []) : props.modelValue) as C2cDocument[] | C2cDocument | null,
  set(value) {
    if (!props.disabled) {
      emit('update:modelValue', value);
    }
  },
});

const documentTypes_ = computed(
  () => (Array.isArray(props.documentType) ? props.documentType : [props.documentType]) as string[]
);

const documentTypesWithResults = computed(() => {
  const result = promise.value.data!;

  return documentTypes_.value.filter((type) => result[type + 's'] && result[type + 's']!.documents.length !== 0);
});

const letterTypes = computed(() =>
  documentTypes_.value.map(
    (item) => constants.objectDefinitions[item as keyof typeof constants.objectDefinitions].letter
  )
);

function focus() {
  input.value!.focus();
}

function closeDropdown() {
  promise.value = {};
}

function onWindowClick(event: MouseEvent) {
  // close dropdown when clicked outside
  if (!rootElement.value?.contains(event.target as Node)) {
    closeDropdown();
  }
}

function loadOptions() {
  promise.value = c2c
    .search({
      q: searchText.value,
      t: letterTypes.value.join(','),
      limit: 7,
      l: $language.current,
      pl: $language.current,
    })
    .then((response) => {
      response.data.profiles = response.data.users;
      emit('load-options', response.data);
    });
}

const onInput = debounce(() => {
  if (!searchText.value || searchText.value.length < 3) {
    promise.value = {};
    return;
  }

  loadOptions();
}, 300);

function isSelected(value: C2cDocument) {
  if (props.multiple) {
    return $documentUtils.isInArray(value_.value as C2cDocument[], value);
  } else {
    return props.modelValue ? (props.modelValue as C2cDocument).document_id === value.document_id : false;
  }
}

function toggle(value: C2cDocument) {
  if (!props.multiple) {
    value_.value = value;
    if (value) {
      emit('add', value);
    }
  } else {
    const newValue = [];
    let removed = false;

    for (const document of value_.value as C2cDocument[]) {
      if (document.document_id === value.document_id) {
        removed = true;
      } else {
        newValue.push(document);
      }
    }

    if (!removed) {
      newValue.push(value);
      emit('add', value);
    }

    value_.value = newValue;
  }
  closeDropdown();
  if (props.clearInputOnToggle) {
    searchText.value = '';
  }
}

window.addEventListener('click', onWindowClick);

onBeforeUnmount(() => {
  window.removeEventListener('click', onWindowClick);
});

defineExpose({ focus });
</script>

<style scoped>
/* overwrite bulma value */
.dropdown-item {
  padding: 0.2rem 1rem; /* 0.375rem 1rem */
}

div.dropdown-item-option:hover {
  background: #eee; /* TODO variables */
}

.input-container {
  width: 100%;
}

.dropdown-menu {
  max-width: 30rem;
  min-width: 30rem;
}
.dropdown-content {
  max-height: 80vh;
  overflow-y: auto;
}

.columns {
  margin-bottom: 0 !important;
}
</style>
