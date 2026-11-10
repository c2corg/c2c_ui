<template>
  <div ref="root" class="dropdown control" :class="{ 'is-active': isOpen }">
    <div class="control has-icons-left input-container">
      <input
        ref="input"
        class="input"
        :class="{ 'is-danger': hasError, 'is-small': isSmall }"
        type="text"
        :placeholder="placeholder || $gettext('Search ...')"
        @input="onFocus"
        @focus="onFocus"
        v-model="searchText"
      />
      <span class="icon is-left">
        <fa-icon icon="search" />
      </span>
    </div>
    <div class="dropdown-menu" role="menu" v-if="isOpen && showOptions">
      <div class="dropdown-content">
        <div v-for="group of groups" :key="group.key">
          <div v-if="group.header" class="dropdown-item has-text-weight-bold is-size-5">
            <!-- if several type are requested, add an header -->
            {{ $filters.uppercaseFirstLetter($gettext(group.type + 's')) }}
          </div>
          <div
            v-for="document of group.documents"
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
            v-if="showMoreResultsLink && group.searched"
            :to="{ name: group.type + 's', query: { q: searchText } }"
            class="dropdown-item is-italic has-text-centered"
            @click="closeDropdown"
            v-translate
          >
            See more results
          </router-link>
        </div>

        <div v-if="proposeCreation">
          <hr v-if="groups.length > 0" class="dropdown-divider" />
          <div class="dropdown-item has-text-weight-bold is-size-5" v-translate>No match?</div>
          <add-link
            v-for="type of documentTypes_"
            :key="type + '_add'"
            :document-type="type"
            class="dropdown-item dropdown-item-option is-size-6"
          />
        </div>

        <div v-else-if="groups.length == 0" class="dropdown-item is-size-6" v-translate>No result found</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type PropType, computed, onBeforeUnmount, ref, useTemplateRef } from 'vue';

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
  // documents proposed as soon as the input has the focus, before the search results (e.g. the recent partners of
  // the user); loaded on the first focus
  loadSuggestions: {
    type: Function as PropType<() => Promise<C2cDocument[]>>,
    default: null,
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

// the suggestions, null until loaded, and whether they are shown (from the focus until the dropdown is closed)
const suggestions = ref<C2cDocument[] | null>(null);
const showSuggestions = ref(false);
let suggestionsRequested = false;

// lower case, without accents
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

// the suggestions matching the typed text, on their name or their forum name
const shownSuggestions = computed(() => {
  if (!showSuggestions.value || !suggestions.value) {
    return [];
  }
  const text = normalize(searchText.value.trim());
  return suggestions.value.filter(
    (document) =>
      !text || [document.name, document.forum_username].some((name) => normalize(String(name ?? '')).includes(text))
  );
});

type Group = { key: string; type: string; header: boolean; searched: boolean; documents: C2cDocument[] };

// what the dropdown lists: the suggestions first, then the search results not already among them
const groups = computed<Group[]>(() => {
  const result: Group[] = [];
  const header = documentTypes_.value.length > 1;
  const suggested = new Set(shownSuggestions.value.map((document) => document.document_id));

  if (shownSuggestions.value.length) {
    result.push({
      key: 'suggestions',
      type: documentTypes_.value[0]!,
      header: false,
      searched: false,
      documents: shownSuggestions.value,
    });
  }

  const data = promise.value.data;
  for (const type of data ? documentTypes_.value : []) {
    const documents = (data![type + 's']?.documents ?? []).filter((document) => !suggested.has(document.document_id));
    if (documents.length) {
      result.push({ key: type, type, header, searched: true, documents });
    }
  }

  return result;
});

const isOpen = computed(() => Boolean(promise.value.data) || shownSuggestions.value.length > 0);

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
  showSuggestions.value = false;
}

function onFocus() {
  if (props.loadSuggestions) {
    showSuggestions.value = true;
    if (!suggestionsRequested) {
      suggestionsRequested = true;
      props.loadSuggestions().then(
        (documents) => {
          suggestions.value = documents;
        },
        () => {
          // a shortcut only: the search works without it; tried again on the next focus
          suggestionsRequested = false;
        }
      );
    }
  }
  onInput();
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
  background: var(--c2c-grey-lightest); /* TODO variables */
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
