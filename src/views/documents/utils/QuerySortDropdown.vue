<template>
  <dropdown-button>
    <span slot="button" class="button is-size-7-mobile">
      <fa-icon :icon="['miscs', 'sort']" />
      <span class="is-hidden-mobile"> &nbsp;{{ $gettext('Sort by') }} </span>
      <span>&nbsp;</span>
      <fa-icon icon="angle-down" aria-hidden="true" />
    </span>

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

<script>
import urlMixin from './url-mixin';

import constants from '@/js/constants';

export default {
  mixins: [urlMixin],

  data() {
    return {
      sortField: null,
      reversed: null,
      complexSort: false,
      sortableFields: [],
    };
  },

  watch: {
    $route: {
      handler: 'updateFromRoute',
      immediate: true,
    },
  },

  methods: {
    setAsComplexSort() {
      this.sortField = null;
      this.reversed = null;
      this.complexSort = true;
    },

    updateFromRoute() {
      const sortableFields = [];

      for (const field of Object.values(constants.objectDefinitions[this.documentType].fields)) {
        if (field.sortable && this.fieldIsVisible(field)) {
          sortableFields.push(field.name);
        }
      }

      this.sortableFields = sortableFields;

      if (!this.$route.query.sort) {
        this.sortField = null;
        this.reversed = null;
        this.complexSort = false;
        return;
      }

      if (this.$route.query.sort.includes(',')) {
        this.setAsComplexSort();
        return;
      }

      let sortField = this.$route.query.sort;
      if (sortField.startsWith('-')) {
        sortField = sortField.substring(1);
        this.reversed = true;
      } else {
        this.reversed = false;
      }

      if (!this.sortableFields.includes(sortField)) {
        this.setAsComplexSort();
        return;
      }

      this.complexSort = false;
      this.sortField = sortField;
    },

    toggle(field) {
      this.setSort(this.sortField === field ? undefined : field);
    },

    clear() {
      this.setSort(undefined);
    },

    setSort(field) {
      const query = Object.assign({}, this.$route.query);
      query.sort = field;
      this.$router.push({ query });
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
