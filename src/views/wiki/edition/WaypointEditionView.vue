<template>
  <edition-container class="edition-container" :mode="mode" :document="document" :is-loading="saving" @save="save">
    <form-section
      :title="$gettext('general informations')"
      :sub-title="$gettext('Waypoint\'s main properties')"
      expanded-on-load
    >
      <div class="columns">
        <form-field class="is-narrow" :document="document" :field="fields.waypoint_type" />
        <form-field :document="document" :field="fields.title" />
      </div>

      <div class="columns">
        <form-field class="is-6" :document="document" :field="fields.elevation" />
        <form-field class="is-6" :document="document" :field="fields.elevation_min" />
        <form-field class="is-6" :document="document" :field="fields.prominence" />
      </div>

      <map-input-row :document="document" ref="map" />

      <div class="columns">
        <form-field
          :document="document"
          :field="fields.maps_info"
          :label="$gettext('maps_references')"
          :placeholder="$gettext('Add here maps not automatically referenced')"
        />
      </div>
    </form-section>

    <form-section
      :title="$gettext('Transport & road or PT access')"
      :sub-title="$gettext('Informations about the access')"
    >
      <div class="columns is-multiline">
        <form-field class="is-4" :document="document" :field="fields.snow_clearance_rating" />
        <form-field class="is-4" :document="document" :field="fields.lift_access" />
        <form-field class="is-4" :document="document" :field="fields.public_transportation_rating" />
        <form-field class="is-4" :document="document" :field="fields.parking_fee" />
        <form-field class="is-8" :document="document" :field="fields.public_transportation_types" />
      </div>
    </form-section>

    <form-section :title="$gettext('Types and styles')">
      <div class="columns is-multiline">
        <form-field class="is-12" :document="document" :field="fields.climbing_outdoor_types" />
        <form-field class="is-12" :document="document" :field="fields.climbing_indoor_types" />
        <form-field class="is-12" :document="document" :field="fields.climbing_styles" />
        <form-field class="is-12" :document="document" :field="fields.rock_types" />
        <form-field class="is-12" :document="document" :field="fields.best_periods" />
      </div>

      <div class="columns is-multiline">
        <form-field class="is-4" :document="document" :field="fields.orientations" />
        <form-field class="is-4" :document="document" :field="fields.access_time" />
        <form-field class="is-4" :document="document" :field="fields.rain_proof" />
        <form-field class="is-4" :document="document" :field="fields.children_proof" />
        <form-field class="is-4" :document="document" :field="fields.ground_types" />
        <form-field class="is-4" :document="document" :field="fields.product_types" />
        <form-field class="is-4" :document="document" :field="fields.slackline_types" />
      </div>
    </form-section>

    <form-section :title="$gettext('Numbers')" :sub-title="$gettext('Misc data about the waypoint')">
      <div class="columns">
        <form-field :document="document" :field="fields.length" />
        <form-field :document="document" :field="fields.slope" />
      </div>

      <div class="columns is-multiline">
        <form-field class="is-4" :document="document" :field="fields.custodianship" />
        <form-field class="is-4" :document="document" :field="fields.capacity_staffed" />
        <!-- $gettext('capacity', 'bivouac') -->
        <form-field class="is-4" :document="document" :field="fields.capacity" :context="capacityContext" />
        <form-field class="is-4" :document="document" :field="fields.url" />
        <form-field class="is-4" :document="document" :field="fields.phone" />
        <form-field class="is-4" :document="document" :field="fields.phone_custodian" />
      </div>

      <div class="columns is-multiline">
        <form-field class="is-6" :document="document" :field="fields.matress_unstaffed" />
        <form-field class="is-6" :document="document" :field="fields.blanket_unstaffed" />
        <form-field class="is-6" :document="document" :field="fields.gas_unstaffed" />
        <form-field class="is-6" :document="document" :field="fields.heating_unstaffed" />
      </div>

      <div class="columns is-multiline">
        <form-field class="is-4" :document="document" :field="fields.height_min" />
        <form-field class="is-4" :document="document" :field="fields.height_median" />
        <form-field class="is-4" :document="document" :field="fields.height_max" />

        <form-field class="is-4" :document="document" :field="fields.routes_quantity" />
        <form-field class="is-4" :document="document" :field="fields.slackline_length_max" />
        <form-field class="is-4" :document="document" :field="fields.slackline_length_min" />
      </div>
    </form-section>

    <form-section :title="$gettext('ratings')" :sub-title="$gettext('Associated routes cotations')">
      <div class="columns is-multiline">
        <form-field class="is-4" :document="document" :field="fields.climbing_rating_min" />
        <form-field class="is-4" :document="document" :field="fields.climbing_rating_median" />
        <form-field class="is-4" :document="document" :field="fields.climbing_rating_max" />
        <form-field class="is-4" :document="document" :field="fields.equipment_ratings" />
        <form-field class="is-4" :document="document" :field="fields.paragliding_rating" />
      </div>
    </form-section>

    <form-section :title="$gettext('Description')" :sub-title="$gettext('Waypoint\'s textual description')">
      <div class="columns is-multiline">
        <form-field
          class="is-12"
          :document="document"
          :field="fields.summary"
          :placeholder="$gettext('write a summary')"
        />

        <form-field
          class="is-12"
          :document="document"
          :field="fields.access_period"
          :placeholder="accessPeriodPlaceholder"
          :label="accessPeriodTitle"
        />

        <form-field
          class="is-12"
          :document="document"
          :field="fields.description"
          :placeholder="descriptionPlaceholder"
        />

        <form-field
          class="is-12"
          :document="document"
          :field="fields.access"
          :placeholder="accessPlaceholder"
          :label="accessTitle"
        />

        <form-field
          class="is-12"
          :document="document"
          :field="fields.external_resources"
          :placeholder="$gettext('Books and websites not already associated to this route')"
        />

        <quality-field class="is-4" :document="document" />
      </div>
    </form-section>

    <form-section
      :title="$gettext('associations')"
      :sub-title="$gettext('You may add associated waypoints, books and articles')"
    >
      <associations-input-row :document="document" :field="fields.articles" />
      <associations-input-row :document="document" :field="fields.waypoints" />
      <associations-input-row :document="document" :field="fields.books" />
    </form-section>
  </edition-container>
</template>

<script>
import documentEditionViewMixin from './utils/document-edition-view-mixin';

import waypointLabels from '@/js/waypoint-labels-mixin';

export default {
  mixins: [documentEditionViewMixin, waypointLabels],

  computed: {
    capacityContext() {
      return this.document && this.document.waypoint_type === 'bivouac' ? this.document.waypoint_type : null;
    },
  },

  watch: {
    'document.geometry.geom': function (to, from) {
      if (from === null && to !== null) {
        this.$nextTick(() => {
          this.$refs.map.fitMapToDocuments();
        });
      }
    },
  },
};
</script>
