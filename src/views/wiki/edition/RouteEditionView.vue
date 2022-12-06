<template>
  <edition-container :mode="mode" :document="document" :is-loading="saving" @save="save">
    <form-section
      :title="$gettext('general informations')"
      :sub-title="
        $gettext(
          'Main information about the route, such as title, activity, GPS, and waypoint (which mountain, place).'
        )
      "
      expanded-on-load
    >
      <div class="columns is-1">
        <form-field
          class="is-narrow"
          :label="$gettext('waypoint')"
          :document="document"
          :field="fields.main_waypoint_id"
        />
        <form-field :document="document" :field="fields.title" />
      </div>
      <div class="columns is-multiline">
        <form-field class="is-narrow" :document="document" :field="fields.climbing_outdoor_type" />
        <form-field class="is-12" :document="document" :field="fields.activities" />
      </div>

      <map-input-row :document="document" geom-detail-editable ref="map" />

      <associations-input-row :document="document" :field="fields.waypoints" />
      <associations-input-row :document="document" :field="fields.routes" />
      <associations-input-row :document="document" :field="fields.articles" />
      <associations-input-row :document="document" :field="fields.books" />
      <associations-input-row :document="document" :field="fields.xreports" />
    </form-section>

    <form-section
      :title="$gettext('configuration')"
      :sub-title="
        $gettext(
          'Data like orientation, rock type, route type (such as return trip or loop) and route configuration type (such as ridge or gully).'
        )
      "
    >
      <div class="columns is-multiline">
        <form-field class="is-12" :document="document" :field="fields.orientations" />
        <form-field class="is-12" :document="document" :field="fields.route_types" />
        <form-field class="is-12" :document="document" :field="fields.configuration" />
        <form-field class="is-12" :document="document" :field="fields.rock_types" />
      </div>
    </form-section>

    <form-section
      :title="$gettext('numbers')"
      :sub-title="$gettext('Information about the terrain, like elevations, lengths...')"
    >
      <div class="columns is-multiline">
        <form-field class="is-6" :document="document" :field="fields.elevation_min" />
        <form-field class="is-6" :document="document" :field="fields.elevation_max" />

        <form-field class="is-6" :document="document" :field="fields.height_diff_up" />
        <form-field class="is-6" :document="document" :field="fields.height_diff_down" />
        <form-field class="is-6" :document="document" :field="fields.height_diff_access" />
        <form-field class="is-6" :document="document" :field="fields.height_diff_difficulties" />

        <form-field class="is-6" :document="document" :field="fields.difficulties_height" />
        <form-field class="is-6" :document="document" :field="fields.route_length" :divisor="1000" unit="km" />
      </div>
      <div class="columns is-multiline">
        <form-field class="is-4" :document="document" :field="fields.mtb_length_asphalt" :divisor="1000" unit="km" />
        <form-field class="is-4" :document="document" :field="fields.mtb_length_trail" :divisor="1000" unit="km" />
        <form-field class="is-4" :document="document" :field="fields.mtb_height_diff_portages" />
      </div>

      <div class="columns is-multiline">
        <form-field class="is-4" :document="document" :field="fields.lift_access" />
        <form-field
          class="is-12"
          :document="document"
          :field="fields.durations"
          :label="$gettext('durations (days)')"
        />
      </div>

      <div class="columns is-multiline">
        <form-field class="is-4" :document="document" :field="fields.slackline_type" />
        <form-field class="is-4" :document="document" :field="fields.slackline_height" />
      </div>
    </form-section>

    <form-section
      :title="$gettext('ratings')"
      :sub-title="$gettext('Everything about ratings : difficulties, exposition...')"
    >
      <div class="columns is-multiline">
        <form-field class="is-6" :document="document" :field="fields.global_rating" />
        <form-field class="is-6" :document="document" :field="fields.rock_free_rating" />
        <form-field class="is-6" :document="document" :field="fields.rock_required_rating" />
        <form-field class="is-6" :document="document" :field="fields.aid_rating" />
      </div>

      <div class="columns is-multiline">
        <form-field class="is-6" :document="document" :field="fields.labande_global_rating" />
        <form-field class="is-6" :document="document" :field="fields.labande_ski_rating" />
        <form-field class="is-6" :document="document" :field="fields.ski_rating" />
        <form-field class="is-6" :document="document" :field="fields.ski_exposition" />
        <form-field class="is-12" :document="document" :field="fields.slope" />
      </div>

      <div class="columns is-multiline">
        <form-field class="is-6" :document="document" :field="fields.ice_rating" />
        <form-field class="is-6" :document="document" :field="fields.mixed_rating" />
        <form-field class="is-6" :document="document" :field="fields.snowshoe_rating" />
        <form-field class="is-6" :document="document" :field="fields.via_ferrata_rating" />
        <form-field class="is-6" :document="document" :field="fields.hiking_rating" />
      </div>

      <div class="columns is-multiline">
        <form-field :document="document" :field="fields.mtb_down_rating" />
        <form-field :document="document" :field="fields.mtb_up_rating" />
        <form-field :document="document" :field="fields.hiking_mtb_exposition" />
      </div>

      <div class="columns is-multiline">
        <form-field class="is-6" :document="document" :field="fields.equipment_rating" />
        <form-field class="is-6" :document="document" :field="fields.engagement_rating" />
        <form-field class="is-6" :document="document" :field="fields.exposition_rock_rating" />
        <form-field class="is-6" :document="document" :field="fields.risk_rating" />
      </div>

      <!-- TODO slope -->
    </form-section>

    <form-section
      :title="$gettext('Comments')"
      :sub-title="
        $gettext(
          'This is where you may describe the route extensively, maybe starting with a brief summary and then developing the description (including approach, descent, etc.). Don\'t forget to mention the route history if you know it.'
        )
      "
    >
      <div class="columns is-multiline">
        <form-field class="is-12" :document="document" :field="fields.summary" />
        <form-field
          class="is-12"
          :document="document"
          :field="fields.route_history"
          :placeholder="$gettext('Describe historical information about the route (date, names..) here')"
        />
        <form-field
          class="is-12"
          :document="document"
          :field="fields.description"
          :placeholder="descriptionPlaceholder"
        />
        <form-field class="is-12" :document="document" :field="fields.slackline_anchor1" />
        <form-field class="is-12" :document="document" :field="fields.slackline_anchor2" />
        <form-field class="is-12" :document="document" :field="fields.remarks" />
        <form-field
          class="is-12"
          :document="document"
          :field="fields.gear"
          :placeholder="$gettext('Describe here the gear needed for this route')"
        />
        <form-field class="is-12" :document="document" :field="fields.glacier_gear" />
        <form-field
          class="is-12"
          :document="document"
          :field="fields.external_resources"
          :placeholder="$gettext('Books and websites not already associated to this route')"
        />

        <quality-field class="is-4" :document="document" />
      </div>
    </form-section>
  </edition-container>
</template>

<script>
import documentEditionViewMixin from './utils/document-edition-view-mixin';

export default {
  mixins: [documentEditionViewMixin],

  computed: {
    descriptionPlaceholder() {
      if (
        ['mountain_climbing', 'rock_climbing', 'ice_climbing'].find((act) => this.document.activities.includes(act))
      ) {
        return this.$gettext('Describe the route following the structure below');
      }
      return undefined;
    },
  },

  watch: {
    'document.associations.waypoints': 'onWaypointsAssociation',
    'document.geometry.geom': 'onGeometryUpdate',
    'document.geometry.geom_detail': 'onGeometryUpdate',
  },

  methods: {
    afterLoad() {
      // on creation from a waypoint, set this waypoint as main
      if (this.mode === 'add' && this.$route.query.w) {
        this.document.main_waypoint_id = parseInt(this.$route.query.w);
      }
    },

    onGeometryUpdate(to, from) {
      if (from === null && to !== null) {
        this.$nextTick(() => {
          this.$refs.map.fitMapToDocuments();
        });
      }
    },

    onWaypointsAssociation() {
      const waypoints = this.document.associations.waypoints;

      // clean main waypoint if it is missing from associated waypoints
      if (waypoints.findIndex((doc) => doc.document_id === this.document.main_waypoint_id) === -1) {
        this.document.main_waypoint_id = null;
      }

      // on creation mode, if main waypoint is null, and some waypoints are associated, take the first
      if (this.mode === 'add' && this.document.main_waypoint_id === null && waypoints.length !== 0) {
        this.document.main_waypoint_id = waypoints[0].document_id;
      }
    },
  },
};
</script>
