<template>
  <div>
    <div class="filter-header-section">
      <p class="too-much-route-label" v-translate>Your search includes too many routes.</p>
      <p v-translate>Help us better target routes that may interest you by adding one or more filters.</p>
    </div>
    <div class="filter-button-dropdown search-infos">
      <dropdown-button
        v-for="category in categorizedFields"
        :key="category.name"
        :disabled="category.fields.length === 0"
        class="query-item-component"
      >
        <template #button>
          <span class="button is-size-7-mobile" :disabled="category.fields.length === 0 || null">
            <fa-icon :icon="CATEGORY_ICON[category.name]" />
            <span class="is-hidden-mobile"> &nbsp;{{ $gettext(category.name) }} </span>
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
    </div>
    <div
      class="routeCount"
      :class="{ 'pulse-red': highlightedRed, 'pulse-green': highlightedGreen }"
      @animationend="onAnimEnd"
    >
      <p>
        <span :class="{ 'above-max-route': !canDisplayResult, 'under-max-route': canDisplayResult }">
          {{ routeCount }}
        </span>
        {{ routeCountMax }}
      </p>
    </div>
    <div class="filter-buttons">
      <button class="button is-primary" :disabled="!isSearchEnabled" @click="search">
        <span v-translate>Apply filters</span>
      </button>
      <button class="button is-primary" @click="() => computeJourneyReachableRoutes()" :disabled="!canDisplayResult">
        <span v-translate>Show results</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import DropdownButton from '../generics/DropdownButton.vue';

import { MAX_ROUTE_THRESHOLD } from '@/js/apis/itinevert-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';
import type Field from '@/js/constants/Field';
import QueryItem from '@/views/documents/utils/QueryItem.vue';

const CATEGORY_ICON: Record<string, string | string[]> = {
  General: 'filter',
  MultiSearch: 'filter',
  Miscs: 'database',
  Terrain: ['waypoint', 'summit'],
  ratings: 'tachometer-alt',
};

const props = defineProps({
  filteredRoutes: {
    type: Object,
    default: () => ({}),
  },
  isSearchEnabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['computeJourneyReachableRoutes', 'search']);

const route = useRoute();
const { $gettext } = useGlobalProperties();

const highlightedRed = ref(false);
const highlightedGreen = ref(false);

const routeFields = (constants.objectDefinitions as unknown as Record<string, { fields: Record<string, Field> }>).route
  .fields;
const categorizedFieldsDefault = constants.categorizedFieldsDefault as Record<string, string[]>;

const categorizedFields = computed(() => {
  const result = [];
  // do not try to compute categorized fields in form view as not useful
  // + can't be done since document type might not be set
  for (const category of Object.keys(categorizedFieldsDefault)) {
    const temp = {
      name: category,
      activeCount: 0,
      fields: [] as Field[],
    };

    let addCategory = false;

    for (const name of categorizedFieldsDefault[category]) {
      const field = routeFields[name];
      if (field !== undefined && field.url) {
        addCategory = true;

        if (route.query[field.url] !== undefined) {
          temp.activeCount += 1;
        }

        if (field.isVisibleForActivities(((route.query.act as string | undefined) ?? '').split(','))) {
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

const routeCount = computed(() => props.filteredRoutes?.total ?? 0);
const routeCountMax = computed(() => ' / ' + MAX_ROUTE_THRESHOLD + ' ' + $gettext('routes'));
const canDisplayResult = computed(() => {
  const total = props.filteredRoutes?.total;
  return total !== null && total > 0 && total <= MAX_ROUTE_THRESHOLD;
});

watch(routeCount, (newVal) => {
  const startRed = newVal > MAX_ROUTE_THRESHOLD;
  // clear both, flush, then enable only the chosen one
  highlightedRed.value = false;
  highlightedGreen.value = false;
  nextTick(() => {
    // ensure removal applied
    requestAnimationFrame(() => {
      if (startRed) highlightedRed.value = true;
      else highlightedGreen.value = true;
    });
  });
});

function search() {
  emit('search');
}

function computeJourneyReachableRoutes() {
  emit('computeJourneyReachableRoutes');
}

function onAnimEnd(e: AnimationEvent) {
  if (e.animationName === 'borderPulseRed') highlightedRed.value = false;
  if (e.animationName === 'borderPulseGreen') highlightedGreen.value = false;
}
</script>

<style scoped lang="scss">
.above-max-route {
  color: red;
}

.under-max-route {
  color: green;
}

.filter-buttons {
  display: flex;
  justify-content: space-between;
}

.routeCount {
  padding: 2rem;
  font-weight: bold;
  border-radius: 10px;
  background: #ebebeb;
  border: 1px solid #d1d1d1;
}

.pulse-green {
  animation: borderPulseGreen 1s ease;
}
.pulse-red {
  animation: borderPulseRed 1s ease;
}

.filter-header-section {
  padding: 2rem;
  border-radius: 10px;
  background: #ebebeb;
  border: 1px solid #d1d1d1;
  font-weight: bold;
  .too-much-route-label {
    color: #ff3262;
    padding-bottom: 2rem;
  }
}
.dropdown-item {
  color: #4a4a4a;
  display: block;
  font-size: 0.875rem;
  line-height: 1.5;
  padding: 0.375rem 1rem;
  position: relative;
}

.query-item-component {
  margin-bottom: 0.5rem;
}

.sub-query-items {
  @media screen and (min-width: $tablet) {
    min-width: 300px;
  }

  @media screen and (max-width: $tablet) {
    overflow: visible;
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
  .search-infos {
    position: relative;
  }

  .searchButton {
    width: 100%;
  }

  .filter-buttons {
    margin-top: auto;
    margin-bottom: 0.5rem;
    .button {
      max-width: 45%;
      white-space: normal;
      height: auto;
    }
  }

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
.filter-button-dropdown {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

/* green pulse */
@keyframes borderPulseGreen {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 150, 136, 0);
    border-color: rgba(0, 150, 136, 0);
  }
  20% {
    box-shadow: 0 0 6px 1px rgba(0, 150, 136, 0.18);
    border-color: rgba(0, 150, 136, 0.45);
  }
  60% {
    box-shadow: 0 0 6px 1px rgba(0, 150, 136, 0.1);
    border-color: rgba(0, 150, 136, 0.22);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 150, 136, 0);
    border-color: rgba(0, 0, 0, 0.12);
  }
}

/* red pulse */
@keyframes borderPulseRed {
  0% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
    border-color: rgba(220, 53, 69, 0);
  }
  20% {
    box-shadow: 0 0 6px 1px rgba(220, 53, 69, 0.18);
    border-color: rgba(220, 53, 69, 0.45);
  }
  60% {
    box-shadow: 0 0 6px 1px rgba(220, 53, 69, 0.1);
    border-color: rgba(220, 53, 69, 0.22);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
    border-color: rgba(0, 0, 0, 0.12);
  }
}
</style>
