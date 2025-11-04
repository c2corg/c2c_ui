<template>
  <div class="query-items">
    <div class="query-items-filters">
      <dropdown-button
        v-for="category of fields"
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
          <span v-if="categoryActiveCount(category.name) != 0"> &nbsp;({{ categoryActiveCount(category.name) }}) </span>
          <span>&nbsp;</span>
          <fa-icon icon="angle-down" aria-hidden="true" />
        </span>

        <div class="sub-query-items">
          <!-- loop over fields -->
          <div v-for="field in category.fields || []" :key="field.field.name">
            <Itinevert-filter-item :field="field.field" v-model="field.value"></Itinevert-filter-item>
          </div>
        </div>
      </dropdown-button>
    </div>
  </div>
</template>

<script>
import ItinevertFilterItem from './ItinevertFilterItem.vue';

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
  },

  data() {
    return {};
  },

  computed: {
    // for filter view, gives the number of fields active in general category
    generalActiveCount() {
      return this.activeFields[0]?.length;
    },
    // for filter view, gives the number of fields active in ratings category
    ratingsActiveCount() {
      return this.activeFields[1]?.length;
    },
    // for filter view, gives the number of fields active in terrain category
    terrainActiveCount() {
      return this.activeFields[2]?.length;
    },
    activeFields() {
      return this.fields.map((category) =>
        category.fields.filter((field) => !this.fieldIsDefault(field.value, field.field))
      );
    },
  },

  watch: {},

  methods: {
    categoryActiveCount(name) {
      if (name === 'General') {
        return this.generalActiveCount;
      } else if (name === 'ratings') {
        return this.ratingsActiveCount;
      } else if (name === 'Terrain') {
        return this.terrainActiveCount;
      }
    },
    /** Return default value for a field */
    initialValue(field) {
      if (!field) return null;
      if (field.queryMode === 'activities') return [];
      if (field.queryMode === 'orientations') return [];
      if (field.queryMode === 'multiSelect' || field.queryMode === 'tristate') return [];
      if (field.queryMode === 'checkbox') return false;
      if (field.queryMode === 'valuesRangeSlider' || field.queryMode === 'numericalRangeSlider') {
        return [field.values?.[0] ?? 0, field.values?.[field.values.length - 1] ?? 0];
      }
      return '';
    },
    /** Test if a field's value is default value or different */
    fieldIsDefault(fieldValue, field) {
      const initialVal = this.initialValue(field);

      // Compare for null
      if (fieldValue === null) {
        return true;
      }

      // Compare for array
      if (Array.isArray(initialVal)) {
        return (
          Array.isArray(fieldValue) &&
          initialVal.length === fieldValue.length &&
          initialVal.every((val, index) => val === fieldValue[index])
        );
      }

      // Compare for boolean
      if (typeof initialVal === 'boolean') {
        return initialVal === fieldValue;
      }

      // Compare for numerical ranges
      if (Array.isArray(initialVal) && typeof initialVal[0] === 'number') {
        return (
          Array.isArray(fieldValue) &&
          fieldValue.length === 2 &&
          initialVal[0] === fieldValue[0] &&
          initialVal[1] === fieldValue[1]
        );
      }

      // General compare for strings
      return initialVal === fieldValue;
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
