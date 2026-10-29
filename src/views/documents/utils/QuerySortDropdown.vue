<template>
  <dropdown-button>
    <template #button>
      <span class="button is-size-7-mobile">
        <fa-icon :icon="['miscs', 'sort']" />
        <span class="is-hidden-mobile"> &nbsp;{{ $gettext('Sort by') }} </span>
        <span>&nbsp;</span>
        <fa-icon icon="angle-down" aria-hidden="true" />
      </span>
    </template>

    <div v-if="complexSort">
      <div class="dropdown-item is-italic" v-translate>You are using a custom sort</div>
      <div class="dropdown-item">
        <button class="button" v-translate @click="clear">Reset</button>
      </div>
    </div>
    <div v-else-if="sortableFields.length">
      <div class="dropdown-item sort-item" v-for="field of sortableFields" :key="field">
        <span
          class="has-cursor-pointer is-nowrap sort-label"
          :class="{ 'has-text-weight-bold': field == sortField }"
          @click="toggle(field)"
        >
          {{ $gettext(field) }}
        </span>
        <span v-if="field == sortField" class="has-cursor-pointer">
          <fa-icon
            v-if="!reversed"
            icon="sort-amount-down-alt"
            @click="setSort('-' + field)"
            :title="$gettext('ascending sort')"
          />
          <fa-icon
            v-if="reversed"
            icon="sort-amount-down"
            @click="setSort(field)"
            :title="$gettext('descending sort')"
          />
        </span>
        <div v-else class="no-sort-filler" />
      </div>
    </div>
    <div v-else>
      <div class="dropdown-item is-italic">
        <span v-if="documentType === 'waypoint'" v-translate>
          Please select a waypoint type to enable sort feature
        </span>
        <span v-translate>Please select an activity to enable sort feature</span>
      </div>
    </div>
  </dropdown-button>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useUrlFilters } from '@/js/composables/url-filters';
import constants from '@/js/constants';

const route = useRoute();
const router = useRouter();
const { documentType, fieldIsVisible } = useUrlFilters();

const sortField = ref<string | null>(null);
const reversed = ref<boolean | null>(null);
const complexSort = ref(false);
const sortableFields = ref<string[]>([]);

function setAsComplexSort() {
  sortField.value = null;
  reversed.value = null;
  complexSort.value = true;
}

function updateFromRoute() {
  const fields: string[] = [];

  for (const field of Object.values(constants.objectDefinitions[documentType.value].fields)) {
    if (field.sortable && fieldIsVisible(field)) {
      fields.push(field.name);
    }
  }

  sortableFields.value = fields;

  const sort = route.query.sort ? String(route.query.sort) : '';

  if (!sort) {
    sortField.value = null;
    reversed.value = null;
    complexSort.value = false;
    return;
  }

  if (sort.includes(',')) {
    setAsComplexSort();
    return;
  }

  let field = sort;
  if (field.startsWith('-')) {
    field = field.substring(1);
    reversed.value = true;
  } else {
    reversed.value = false;
  }

  if (!sortableFields.value.includes(field)) {
    setAsComplexSort();
    return;
  }

  complexSort.value = false;
  sortField.value = field;
}

function toggle(field: string) {
  setSort(sortField.value === field ? undefined : field);
}

function clear() {
  setSort(undefined);
}

function setSort(field: string | undefined) {
  router.push({ query: { ...route.query, sort: field } });
}

watch(() => route.fullPath, updateFromRoute, { immediate: true });
</script>

<style lang="scss" scoped>
.no-sort-filler {
  width: 20px;
}

.sort-item {
  display: flex !important;
}
.sort-label {
  flex-grow: 1;
  padding-right: 3em;
}
</style>
