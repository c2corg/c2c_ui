<template>
  <div class="query-items">
    <div class="query-items-filters">
      <dropdown-button
        v-for="(category, index) in fields"
        :key="category.name"
        class="query-item-component"
        :disabled="category.fields.length === 0"
      >
        <span slot="button" class="button is-size-7-mobile" :disabled="category.fields.length === 0">
          <fa-icon :icon="$options.categoryIcon[category.name]" />
          <span class="is-hidden-mobile">
            <!-- $gettext('General') -->
            <!-- $gettext('ratings') -->
            <!-- $gettext('Terrain') -->
            <!-- $gettext('Miscs') -->
            &nbsp;{{ $gettext(category.name) }}
          </span>
          <span v-if="activeFields[index]?.length != 0"> &nbsp;({{ activeFields[index]?.length }}) </span>
          <span>&nbsp;</span>
          <fa-icon icon="angle-down" aria-hidden="true" />
        </span>
        <div class="sub-query-items">
          <itinevert-filter-item
            v-for="field in category.fields || []"
            :key="field.field.name"
            :field="field.field"
            v-model="field.value"
            class="dropdown-item"
          ></itinevert-filter-item>
        </div>
      </dropdown-button>
      <!-- <dropdown-button key="multi-search" class="query-item-component is-hidden-tablet">
        <span slot="button" class="button is-size-7-mobile">
          <fa-icon :icon="$options.categoryIcon['MultiSearch']" />
          <span>&nbsp;</span>
          <fa-icon icon="angle-down" aria-hidden="true" />
        </span>
        <div class="sub-query-items">
          <association-query-item class="dropdown-item" :document-types="associations" @add="addTag" />
          <div class="query-items-tags dropdown-item">
            <query-tags :documents="tags" @remove="removeTag"></query-tags>
          </div>
        </div>
      </dropdown-button> -->

      <itinevert-sort-dropdown
        v-if="['waypoint', 'route', 'image', 'outing'].includes(documentType)"
        class="query-item-component"
        :document-type="documentType"
        :sort-field="sortField"
        @sort-query="sortPostNavitiaDocuments"
      />

      <!-- <association-query-item
        class="query-item-component is-hidden-mobile"
        :document-types="associations"
        @add="addTag"
      /> -->
    </div>
  </div>
</template>

<script>
import ItinevertFilterItem from './ItinevertFilterItem.vue';
import ItinevertSortDropdown from './ItinevertSortDropdown.vue';

import itinevertService from '@/js/apis/itinevert-service';
import AssociationQueryItem from '@/views/documents/utils/AssociationQueryItem.vue';
import QueryTags from '@/views/documents/utils/QueryTags.vue';

export default {
  categoryIcon: {
    General: 'filter',
    MultiSearch: 'filter',
    Miscs: 'database',
    Terrain: ['waypoint', 'summit'],
    ratings: 'tachometer-alt',
  },

  components: {
    ItinevertFilterItem,
    //AssociationQueryItem,
    ItinevertSortDropdown,
    //QueryTags,
  },

  props: {
    fields: {
      type: Array,
      default: () => [],
    },
    listMode: {
      type: Boolean,
      default: false,
    },
    documentType: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      tags: [],
      sortField: '',
      postNavitiaActiveFields: [],
    };
  },

  computed: {
    activeFields() {
      return this.fields.map((category) =>
        category.fields.filter((field) => !itinevertService.isFieldValueDefault(field.value, field.field))
      );
    },
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
  },

  watch: {
    fields: {
      handler() {
        this.$emit('new-filter', this.activeFields, null);
      },
      deep: true,
    },
  },

  mounted() {
    // store the first active fields
    this.postNavitiaActiveFields = this.fields.map((category) =>
      category.fields.filter((field) => !itinevertService.isFieldValueDefault(field.value, field.field))
    );
  },

  methods: {
    sortPostNavitiaDocuments(sortField) {
      this.sortField = sortField.field;
      let sort = sortField.reversed ? '-' + sortField.field : sortField.field;
      this.$emit('new-filter', this.activeFields, sort);
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
