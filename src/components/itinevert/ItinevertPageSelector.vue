<template>
  <span class="page-selector ml-1">
    <!-- chevron left -->
    <span
      v-if="firstDocumentPosition > 0"
      class="pagination-link button has-text-normal"
      @click="pageQuery(offset - limit, limit)"
    >
      <fa-icon icon="chevron-left" />
    </span>
    <span v-else class="pagination-link button has-text-normal is-disabled">
      <fa-icon icon="chevron-left" />
    </span>
    <!-- docs showed / total -->
    {{ total === 0 ? 0 : firstDocumentPosition + 1 }}-{{ lastDocumentPosition }}
    <span v-translate translate-context="1-30 of 200 results">of</span>
    {{ total }}
    <!-- chevron right -->
    <span
      v-if="lastDocumentPosition < total"
      class="pagination-link button has-text-normal"
      @click="pageQuery(offset + limit, limit)"
    >
      <fa-icon icon="chevron-right" />
    </span>
    <span v-else class="pagination-link button has-text-normal is-disabled">
      <fa-icon icon="chevron-right" />
    </span>
    <span class="limit-selector">
      <dropdown-button class="ml-1 mr-1" ref="limitSelector">
        <template #button>
          <span class="button is-small">
            <span>{{ limit }}</span>
            &nbsp;
            <fa-icon icon="angle-down" aria-hidden="true" />
          </span>
        </template>
        <span
          v-for="l in [30, 50, 100]"
          :key="l"
          class="dropdown-item is-small"
          :class="{ 'is-active': limit === l }"
          @click="selectLimit(l)"
        >
          {{ l }}
        </span>
      </dropdown-button>
      <span v-translate translate-context="30 per page">per page</span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';

const props = defineProps({
  documents: {
    type: Object,
    default: null,
  },
  offset: {
    type: Number,
    default: 0,
  },
  limit: {
    type: Number,
    default: 30,
  },
});

const emit = defineEmits(['paginate']);

const total = ref<number>(props.documents?.total ?? 0);
const limitSelector = useTemplateRef<{ isActive: boolean }>('limitSelector');

const firstDocumentPosition = computed(() => Math.max(props.offset, 0));
const lastDocumentPosition = computed(() => Math.min(props.offset + props.limit, total.value));

watch(
  () => props.documents,
  () => {
    if (props.documents) {
      total.value = props.documents.total;
    }
  }
);

function pageQuery(off: number, lim: number) {
  // emit to parent that offset and limit have changed
  emit('paginate', [Math.max(off, 0), lim]);
}

function selectLimit(l: number) {
  // emit to parent that offset and limit have changed
  emit('paginate', [props.offset, l]);
  limitSelector.value!.isActive = false;
}
</script>

<style scoped lang="scss">
.pagination-link {
  height: 1.75em;
}

.limit-selector {
  cursor: pointer;
}

.is-active {
  background-color: #337ab7 !important;
  color: #fff !important;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
  color: #0a0a0a;
}

@media screen and (max-width: 340px) {
  .limit-selector {
    display: none;
  }
}
</style>
