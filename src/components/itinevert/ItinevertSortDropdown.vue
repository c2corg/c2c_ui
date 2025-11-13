<template>
  <dropdown-button>
    <span slot="button" class="button is-size-7-mobile">
      <fa-icon :icon="['miscs', 'sort']" />
      <span class="is-hidden-mobile"> &nbsp;{{ $gettext('Sort by') }} </span>
      <span>&nbsp;</span>
      <fa-icon icon="angle-down" aria-hidden="true" />
    </span>
    <div v-if="sortableFields.length">
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

<script>
import constants from '@/js/constants';

export default {
  props: {
    documentType: {
      type: String,
      default: '',
    },
    sortField: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      reversed: null,
      sortableFields: [],
      selectedSort: '',
    };
  },

  watch: {},

  async mounted() {
    this.updateSortableFields();
  },

  methods: {
    updateSortableFields() {
      const sortableFields = [];

      for (const field of Object.values(constants.objectDefinitions[this.documentType].fields)) {
        if (field.sortable && this.fieldIsVisible(field)) {
          sortableFields.push(field.name);
        }
      }

      this.sortableFields = sortableFields;
      this.selectedSort = this.sortField;
    },

    toggle(field) {
      this.setSort(this.sortField === field ? undefined : field);
    },

    clear() {
      this.setSort(undefined);
    },

    setSort(field) {
      if (field?.startsWith('-')) {
        field = field.substring(1);
        this.reversed = true;
      } else {
        this.reversed = false;
      }
      this.$emit('sort-query', { field: field, reversed: this.reversed });
    },

    fieldIsVisible(field) {
      if (this.documentType === 'waypoint') {
        if (field.isVisibleForWaypointTypes(this.urlWaypointTypes)) {
          return true;
        }
      } else if (field.isVisibleForActivities(this.urlActivities)) {
        return true;
      }

      return false;
    },
  },
};
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
