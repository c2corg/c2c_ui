<template>
  <div class="query-items">
    <query-item :field="fields.title" class="title-input is-hidden-mobile" hide-label />

    <dropdown-button
      v-for="category of categorizedFields"
      :key="category.name"
      class="category-button"
      @changeDisplay="refreshSliders()">

      <span slot="button" class="button" :disabled="category.fields.length===0">
        <fa-icon :icon="$options.categoryIcon[category.name]" />
        <span class="is-hidden-mobile">
          <!-- $gettext('General') -->
          <!-- $gettext('ratings') -->
          <!-- $gettext('Terrain') -->
          <!-- $gettext('Miscs') -->
          &nbsp;{{ $gettext(category.name) }}
        </span>
        <span v-if="category.activeCount!=0">
          &nbsp;({{ category.activeCount }})
        </span>
        <span>&nbsp;</span>
        <fa-icon icon="angle-down" aria-hidden="true" />
      </span>

      <div class="sub-query-items">
        <query-item
          v-for="field of category.fields"
          :key="field.name"
          :field="field"
          class="dropdown-item"
          :class="field.name === 'title' ? 'is-hidden-tablet': ''" />
      </div>

    </dropdown-button>

    <association-query-item class="association-query-item is-hidden-mobile" :document-types="associations" />
  </div>
</template>

<script>
  import constants from '@/js/constants';
  import QueryItem from './QueryItem';
  import AssociationQueryItem from './AssociationQueryItem';

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
      'date_start'
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
      'exposition_rating',
      'public_transportation_rating',
      'climbing_rating_max',
      'climbing_rating_median',
      'climbing_rating_min',
      'paragliding_rating',
      'snow_clearance_rating'
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
      'glacier_gear'
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
      'severity'
    ]
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
    xreport: categorizedFieldsDefault
  };

  export default {

    categoryIcon: {
      General: 'filter',
      Miscs: 'database',
      Terrain: ['waypoint', 'summit'],
      ratings: 'tachometer-alt'
    },

    components: {
      QueryItem,
      AssociationQueryItem
    },

    computed: {
      urlActivities() {
        return (this.$route.query.act || '').split(',');
      },

      urlWaypointTypes() {
        return (this.$route.query.wtyp || '').split(',');
      },

      fields() {
        return constants.objectDefinitions[this.documentType].fields;
      },

      documentType() {
        return this.$route.name.slice(0, -1);
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

      categorizedFields() {
        const result = [];

        for (const category of Object.keys(categorizedFields[this.documentType])) {
          const temp = {
            name: category,
            activeCount: 0,
            fields: []
          };

          let addCategory = false;

          for (const name of categorizedFields[this.documentType][category]) {
            const field = this.fields[name];
            if (field !== undefined) {
              addCategory = true;

              if (this.$route.query[field.url] !== undefined) {
                temp.activeCount += 1;
              }

              if (this.documentType === 'waypoint') {
                if (field.isVisibleForWaypointTypes(this.urlWaypointTypes)) {
                  temp.fields.push(field);
                }
              } else if (field.isVisibleForActivities(this.urlActivities)) {
                temp.fields.push(field);
              }
            }
          }

          if (addCategory) {
            result.push(temp);
          }
        }

        return result;
      }
    },

    methods: {
      refreshSliders() {
        for (const dropdown of this.$children) {
          if (dropdown.isActive) {
            for (const queryItem of dropdown.$children) {
              queryItem.refreshSlider();
            }
          }
        }
      }
    }
  };
</script>

<style scoped lang="scss">

  @import '@/assets/sass/variables.scss';

  .title-input{
    display: inline-flex;
    margin-bottom: 0!important;
  }

  .sub-query-items{
    min-width:300px;
  }

  @media screen and (min-width: $tablet) {
    .query-items{
      display: flex;
    }
    .title-input, .category-button{
      margin-right:1em;
    }
  }

  @media screen and (max-width: $tablet) {
    .query-items{
      position:relative; // important; to force dropdown to be on stick to left
      display: flex;
      justify-content: flex-start;

      .title-input, .category-button{
        margin-right:1em;
      }

      .dropdown {
        position: unset;

        .dropdown-menu {
          width: 100%;
        }
      }

      // .category-button{
      //   flex-grow: 1;
      //   flex-shrink: 1;
      // }

      // .title-input{
      //   flex-basis: 3rem;
      //   flex-grow: 3;
      //   flex-shrink: 0.01;
      // }

      // .title-input:focus-within{
      //   flex-basis: 3rem;
      // }
    }
  }
  @media screen and (min-width: $tablet) and (max-width: $desktop){
  }
  @media screen and (min-width: $desktop) {
  }

</style>
