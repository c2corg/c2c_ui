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
        <span slot="button" class="button is-size-7-mobile" :disabled="category.fields.length === 0">
          <fa-icon :icon="$options.categoryIcon[category.name]" />
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
        <span slot="button" class="button is-size-7-mobile">
          <fa-icon :icon="$options.categoryIcon['MultiSearch']" />
          <span>&nbsp;</span>
          <fa-icon icon="angle-down" aria-hidden="true" />
        </span>
        <div class="sub-query-items">
          <association-query-item
            class="dropdown-item"
            :document-types="associations"
            @add="addTag"
          />
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
      <load-user-preferences-button class="is-hidden-tablet query-item-component" />
      <export-csv-button v-if="listMode" class="is-small-mobile"></export-csv-button>
    </div>
    <div class="query-items-tags is-hidden-mobile">
      <query-tags :documents="tags" @remove="removeTag"></query-tags>
    </div>
  </div>
</template>

<script>
import AssociationQueryItem from './AssociationQueryItem';
import ExportCsvButton from './ExportCsvButton.vue';
import LoadUserPreferencesButton from './LoadUserPreferencesButton';
import QueryItem from './QueryItem';
import QuerySortDropdown from './QuerySortDropdown';
import QueryTags from './QueryTags';
import urlMixin from './url-mixin';

import c2c from '@/js/apis/c2c';
import constants from '@/js/constants';

const documentsCache = {};

const categorizedFieldsDefault = {
  General: [
    'title',
    'activities',
    'article_type',
    'area_type',
    'book_types',
    'waypoint_type',
    'event_type',
    'climbing_outdoor_type',
    'route_types',
    'quality',
    'categories',
    'dates',
  ],

  ratings: [
    'global_rating',
    'rock_free_rating',
    'rock_required_rating',
    'aid_rating',
    'engagement_rating',
    'risk_rating',
    'equipment_rating',
    'exposition_rock_rating',
    'ice_rating',
    'mixed_rating',
    'ski_rating',
    'hiking_rating',
    'ski_exposition',
    'labande_global_rating',
    'labande_ski_rating',
    'snowshoe_rating',
    'via_ferrata_rating',
    'mtb_down_rating',
    'mtb_up_rating',
    'hiking_mtb_exposition',
    'glacier_rating',
    'equipment_ratings',
    'public_transportation_rating',
    'climbing_rating_max',
    'climbing_rating_median',
    'climbing_rating_min',
    'paragliding_rating',
    'snow_clearance_rating',
  ],

  Terrain: [
    'condition_rating',
    'orientations',
    'configuration',
    'elevation_max',
    'elevation_min',
    'difficulties_height',
    'height_diff_access',
    'height_diff_difficulties',
    'height_diff_down',
    'height_diff_up',
    'mtb_height_diff_portages',
    'mtb_length_asphalt',
    'mtb_length_trail',
    'rock_types',
    'slackline_type',
    'snow_quality',
    'snow_quantity',
    'avalanche_signs',
    'elevation_access',
    'elevation_down_snow',
    'elevation_up_snow',
    'children_proof',
    'prominence',
    'climbing_indoor_types',
    'climbing_outdoor_types',
    'climbing_styles',
    'elevation',
    'height_max',
    'height_median',
    'height_min',
    'length',
    'rain_proof',
    'routes_quantity',
    'length_total',
    'route_length',
    'durations',
    'glacier_gear',
  ],
  Miscs: [
    'lang',
    'frequentation',
    'public_transport',
    'lift_access',
    'access_time',
    'best_periods',
    'capacity',
    'capacity_staffed',
    'custodianship',
    'product_types',
    'public_transportation_types',
    'weather_station_types',
    'nb_participants',
    'nb_impacted',
    'severity',
    'image_type',
  ],
};

const categorizedFields = {
  area: categorizedFieldsDefault,
  article: categorizedFieldsDefault,
  book: categorizedFieldsDefault,
  image: categorizedFieldsDefault,
  map: categorizedFieldsDefault,
  outing: categorizedFieldsDefault,
  profile: categorizedFieldsDefault,
  route: categorizedFieldsDefault,
  waypoint: categorizedFieldsDefault,
  xreport: categorizedFieldsDefault,
};

export default {
  categoryIcon: {
    General: 'filter',
    MultiSearch: 'filter',
    Miscs: 'database',
    Terrain: ['waypoint', 'summit'],
    ratings: 'tachometer-alt',
  },

  components: {
    AssociationQueryItem,
    QueryItem,
    QuerySortDropdown,
    QueryTags,
    ExportCsvButton,
    LoadUserPreferencesButton,
  },

  mixins: [urlMixin],

  props: {
    listMode: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      tags: [],
    };
  },

  computed: {
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

    categorizedFields() {
      const result = [];

      for (const category of Object.keys(categorizedFields[this.documentType])) {
        const temp = {
          name: category,
          activeCount: 0,
          fields: [],
        };

        let addCategory = false;

        for (const name of categorizedFields[this.documentType][category]) {
          const field = this.fields[name];
          if (field !== undefined && field.url) {
            addCategory = true;

            if (this.$route.query[field.url] !== undefined) {
              temp.activeCount += 1;
            }

            if (this.fieldIsVisible(field)) {
              temp.fields.push(field);
            }
          }
        }

        if (addCategory) {
          result.push(temp);
        }
      }

      return result;
    },
  },

  watch: {
    $route: {
      handler: 'load',
      immediate: true,
    },
  },

  methods: {
    getUrlValue(documentType) {
      const key = constants.objectDefinitions[documentType].letter;

      return this.$route.query[key];
    },

    setUrlValue(documentType, value) {
      const key = constants.objectDefinitions[documentType].letter;

      const query = Object.assign({}, this.$route.query);
      query[key] = value === '' ? undefined : value;

      if (query[key] !== this.$route.query[key]) {
        this.$router.push({ query });
      }
    },

    getValue(documentType) {
      const urlValue = this.getUrlValue(documentType);

      return urlValue
        ? String(urlValue)
            .split(',')
            .map((num) => parseInt(num, 10))
        : [];
    },

    setValue(documentType, value) {
      this.setUrlValue(documentType, value.join(','));
    },

    load() {
      this.tags = [];

      for (const documentType of this.associations) {
        for (const documentId of this.getValue(documentType)) {
          this.tags.push(this.getDocument(documentType, documentId));
        }
      }

      this.emitDocumentsLoad();
    },

    getDocument(documentType, documentId) {
      const key = `${documentType}#${documentId}`;

      if (documentsCache[key] === undefined) {
        documentsCache[key] = {
          document_id: documentId,
          loading: true,
        };

        c2c[documentType].get(documentId).then((response) => {
          documentsCache[key].loading = false;
          Object.assign(documentsCache[key], response.data);
          this.emitDocumentsLoad();
        });
      }

      return documentsCache[key];
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

    emitDocumentsLoad() {
      this.$emit('documents-load', this.tags);
    },
  },
};
</script>

<style scoped lang="scss">
.query-items-filters {
  margin-bottom: 0.5rem;
  font-size: 0;

  > div {
    font-size: 1rem;
  }
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

    scrollbar-width: none;  // Firefox

    &::-webkit-scrollbar {
      display: none;  // Chrome, Safari and Opera
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
