<template>
  <edition-container v-if="document" :mode="mode" :document="document" :is-loading="saving" @save="save">
    <form-section
      :title="$gettext('general informations')"
      :sub-title="$gettext('Main informations about your outing')"
      expanded-on-load
    >
      <div class="columns">
        <form-field
          class="is-narrow"
          :document="document"
          :field="fields.date_start"
          :max="showBothDates ? document.date_end : currentDate"
          @input="handleDates"
          @click.native="setCurrentDate"
        />
        <form-field
          class="is-narrow"
          v-show="showBothDates"
          :document="document"
          :field="fields.date_end"
          :min="showBothDates ? document.date_start : undefined"
          :max="currentDate"
          @click.native="setCurrentDate"
        />
        <div class="column is-narrow">
          <input-checkbox v-model="showBothDates">{{ $gettext('Several days?') }}</input-checkbox>
        </div>
      </div>

      <div class="columns is-multiline">
        <form-field class="is-two-fifths" :document="document" :field="fields.activities" />
        <div class="column">
          <map-input-row
            class="field"
            :document="document"
            :documents="possibleRoutes"
            geom-detail-editable
            ref="mapInput"
            @move="updateBbox"
            :initial-extent="initialExtent"
          />
        </div>
      </div>

      <div class="field">
        <label class="label">
          {{ $gettext('routes') | uppercaseFirstLetter }}:
          <marker-helper name="1063027#routes" />
        </label>
        <div class="control">
          <input class="input" type="text" placeholder="Name" v-model="routeTitle" />
        </div>
      </div>

      <div v-if="possibleRoutes && possibleRoutes.length !== 0" class="field">
        <div v-for="route of possibleRoutes" :key="route.document_id">
          <input-checkbox :value="routeIsAssociated(route.document_id)" @input="changeRouteAssociation($event, route)">
            <activities :activities="route.activities" class="is-size-4 has-text-secondary" />
            <document-title :document="route" />,
            <document-rating :document="route" />
          </input-checkbox>
          <document-link :document="route" target="_blank" :title="$gettext('Open in a new tab')">
            <fa-icon icon="link" />
          </document-link>
        </div>
      </div>

      <div class="notification is-info" v-else>
        <span v-translate>Please move the map, or change the route's name.</span>
        <span v-translate>If the route does not exists in our base, you can create it.</span>
      </div>

      <div class="notification is-info" v-if="showMoreResultsBanner">
        <span v-translate>
          More routes are available. You can move the map, specify the name or set an activity to filter them out.
        </span>
      </div>

      <div class="columns is-multiline">
        <form-field :document="document" :field="fields.title" />
        <form-field class="is-narrow" :document="document" :field="fields.partial_trip" />
        <form-field
          class="is-12"
          :document="document"
          :field="fields.route_description"
          :placeholder="$gettext('describe route_conditions')"
        />
      </div>
    </form-section>

    <form-section
      :title="$gettext('Weather & conditions')"
      :sub-title="$gettext('Describe the conditions you encountered during your outing')"
    >
      <div class="columns is-multiline">
        <form-field class="is-6" :document="document" :field="fields.condition_rating" />
        <form-field class="is-6" :document="document" :field="fields.glacier_rating" />
        <form-field class="is-12" :document="document" :field="fields.conditions_levels" />
      </div>
      <div class="columns">
        <form-field :document="document" :field="fields.elevation_up_snow" />
        <form-field :document="document" :field="fields.elevation_down_snow" />
      </div>
      <div class="columns">
        <form-field :document="document" :field="fields.snow_quantity" />
        <form-field :document="document" :field="fields.snow_quality" />
      </div>
      <div class="columns is-multiline">
        <form-field
          class="is-12"
          :document="document"
          :field="fields.conditions"
          :placeholder="$gettext('describe conditions')"
        />
        <form-field
          class="is-6"
          :document="document"
          :field="fields.weather"
          :placeholder="$gettext('describe weather')"
        />
        <form-field
          class="is-6"
          :document="document"
          :field="fields.timing"
          :placeholder="$gettext('describe timing')"
        />
        <form-field class="is-12" :document="document" :field="fields.avalanche_signs" />
        <form-field class="is-12" :document="document" :field="fields.avalanches" />
      </div>
    </form-section>

    <form-section
      :title="$gettext('Personal informations')"
      :sub-title="$gettext('People who were with you, and your feelings about this outing')"
    >
      <associations-input-row :label="$gettext('participants')" :document="document" :field="fields.users" />
      <div class="columns">
        <form-field :document="document" :field="fields.participant_count" class="is-narrow" />
        <form-field :document="document" :field="fields.participants" :placeholder="$gettext('Without c2c account')" />
      </div>
      <div class="columns is-multiline">
        <form-field
          class="is-12"
          :document="document"
          :field="fields.description"
          :label="$gettext('personal comments')"
          :placeholder="$gettext('write your comments')"
        />
        <form-field :document="document" :field="fields.disable_comments" />
      </div>
      <div class="columns">
        <form-field :document="document" :field="fields.disable_view_count" />
      </div>
    </form-section>

    <form-section
      :title="$gettext('Details')"
      :sub-title="$gettext('Detailed figures, like ratings, height differences, frequentation...')"
    >
      <div class="columns">
        <form-field class="is-4" :document="document" :field="fields.frequentation" />
      </div>

      <div class="columns is-multiline">
        <div class="column is-4">
          <form-field no-wrapper :document="document" :field="fields.elevation_access" />
          <form-field no-wrapper :document="document" :field="fields.access_condition" />
          <form-field no-wrapper :document="document" :field="fields.public_transport" />
        </div>
        <form-field class="is-8" :document="document" :field="fields.access_comment" />

        <div class="column is-4">
          <form-field no-wrapper :document="document" :field="fields.lift_status" />
          <form-field no-wrapper :document="document" :field="fields.hut_status" />
        </div>
        <form-field class="is-8" :document="document" :field="fields.hut_comment" />
      </div>

      <div class="columns">
        <form-field class="is-4" :document="document" :field="fields.height_diff_up" />
        <form-field class="is-4" :document="document" :field="fields.height_diff_down" />
        <form-field class="is-4" :document="document" :field="fields.height_diff_difficulties" />
      </div>

      <div class="columns">
        <form-field class="is-4" :document="document" :field="fields.length_total" unit="km" :divisor="1000" />
        <form-field class="is-4" :document="document" :field="fields.elevation_min" />
        <form-field class="is-4" :document="document" :field="fields.elevation_max" />
      </div>

      <div class="columns is-multiline">
        <form-field class="is-4" :document="document" :field="fields.global_rating" />
        <form-field class="is-4" :document="document" :field="fields.rock_free_rating" />
        <form-field class="is-4" :document="document" :field="fields.engagement_rating" />
        <form-field class="is-4" :document="document" :field="fields.equipment_rating" />

        <form-field
          class="is-4"
          :document="document"
          :field="fields.ski_rating"
          prefix="?"
          @click-prefix="showCotometer"
        />
        <form-field class="is-4" :document="document" :field="fields.labande_global_rating" />

        <form-field class="is-4" :document="document" :field="fields.ice_rating" />
        <form-field class="is-4" :document="document" :field="fields.snowshoe_rating" />
        <form-field class="is-4" :document="document" :field="fields.via_ferrata_rating" />
        <form-field class="is-4" :document="document" :field="fields.hiking_rating" />
      </div>

      <div class="columns">
        <form-field class="is-4" :document="document" :field="fields.mtb_down_rating" />
        <form-field class="is-4" :document="document" :field="fields.mtb_up_rating" />
      </div>

      <div class="columns">
        <quality-field ref="qualityField" class="is-4" :document="document" />
      </div>
    </form-section>

    <!-- TODO where is that ??
            <form-field :document="document" :field="fields.summary"/>
        -->
    <cotometer-window ref="cotometerWindow" v-if="document" v-model="document.ski_rating" />
  </edition-container>
</template>

<script>
import CotometerWindow from './utils/CotometerWindow';
import documentEditionViewMixin from './utils/document-edition-view-mixin';

import c2c from '@/js/apis/c2c';

export default {
  components: { CotometerWindow },

  mixins: [documentEditionViewMixin],

  data() {
    return {
      showBothDates: false,
      possibleRoutes: null,
      routeTitle: '',
      bbox: null,
      showMoreResultsBanner: false,
      currentDate: this.getCurrentDateString(),
    };
  },

  computed: {
    initialExtent() {
      if (this.$route.query.initial_bbox) {
        return this.$route.query.initial_bbox.split(',').map(parseFloat);
      } else if (this.document.associations.routes.length) {
        return this.$documentUtils.getDocumentsBbox(this.document.associations.routes);
      }

      return null;
    },
  },

  watch: {
    showBothDates: 'handleDates',
    'document.activities': function (to, from) {
      if (from === undefined) {
        return; // initial load
      }
      this.updateRoutes('activities', false);
    },

    'document.geometry.geom_detail': function (to, from) {
      if (from === null && to !== null) {
        this.possibleRoutes = null;
        this.$nextTick(async () => {
          await this.fitMapToDocuments();
          this.updateRoutes();
        });
      }
    },

    routeTitle() {
      this.updateRoutes('routeTitle', false);
    },
  },

  methods: {
    afterLoad() {
      this.showBothDates = this.document.date_start !== this.document.date_end;
    },

    updateBbox(bbox) {
      if (this.bbox === null && this.initialExtent === null && this.mode === 'add') {
        // IF it's the very first load
        // AND if there is no specific bbox expected in th URL
        // AND you are creating an outing
        // THEN the bbox will be the default one => do not load possible routes
        this.bbox = bbox;
        return;
      }

      if (bbox.join(',') !== this.bbox?.join(',')) {
        this.bbox = bbox;
        this.updateRoutes('bbox', false);
      }
    },

    async fitMapToDocuments() {
      this.bbox = await this.$refs.mapInput.fitMapToDocuments();
    },

    updateRoutes(reason, fitMap) {
      if (!this.bbox) {
        return reason;
      }

      const query = { limit: 50, bbox: this.bbox.join(',') };

      if (this.routeTitle) {
        query.q = this.routeTitle;
      }

      if (this.document.activities.length) {
        query.act = this.document.activities.join(',');
      }

      const promise = c2c.route.getAll(query);

      promise.then((response) => this.computePossibleRoutes(response.data.documents, response.data.total, fitMap));

      return promise;
    },

    clearPossibleRoutes() {
      this.computePossibleRoutes([], 0, false);
    },

    computePossibleRoutes(routes, total, fitMap) {
      this.showMoreResultsBanner = total !== routes.length;

      // always add actual associations to possible routes
      const routeIds = routes.map((r) => r.document_id);
      routes = [...routes, ...this.document.associations.routes.filter((r) => !routeIds.includes(r.document_id))];

      // sort by title
      routes.sort((a, b) =>
        this.$documentUtils.getDocumentTitle(a).localeCompare(this.$documentUtils.getDocumentTitle(b))
      );

      // assign
      this.possibleRoutes = routes;

      // recenter the map to possible routes
      if (fitMap) {
        this.$nextTick(this.fitMapToDocuments);
      }
    },

    changeRouteAssociation(addRoute, route) {
      // Adding a route still present, or removing a route not present?
      if (
        (!addRoute && !this.routeIsAssociated(route.document_id)) ||
        (addRoute && this.routeIsAssociated(route.document_id))
      ) {
        return;
      }

      const routes = this.document.associations.routes;

      if (addRoute) {
        routes.push(route);

        if (routes.length === 1) {
          this.possibleRoutes = [];

          this.$nextTick(async () => {
            // for first association, force the localization to be the route localization
            this.$documentUtils.propagateProperties(this.document, route);
            await this.fitMapToDocuments();
            this.updateRoutes('First route', false);
          });
        } else {
          this.$documentUtils.propagateProperties(this.document, route);
        }
      } else {
        this.document.associations.routes = routes.filter((r) => r.document_id !== route.document_id);

        if (!this.document.associations.routes.length) {
          // if there is no more route associated, the localization is obsolete
          this.document.geometry.geom = null;
        }
      }
    },

    routeIsAssociated(route_id) {
      return this.document.associations.routes.filter((route) => route.document_id === route_id).length !== 0;
    },

    handleDates() {
      if (!this.showBothDates) {
        this.document.date_end = this.document.date_start;
      } else if (this.document.date_end < this.document.date_start) {
        this.document.date_end = this.document.date_start;
      }
    },

    setCurrentDate() {
      this.currentDate = this.getCurrentDateString();
    },

    beforeSave() {
      this.handleDates();
      this.$refs.qualityField.beforeSave();
    },

    showCotometer() {
      this.$refs.cotometerWindow.show();
    },

    getCurrentDateString() {
      return this.$dateUtils.toLocalizedString(new Date(), 'YYYY-MM-DD');
    },
  },
};
</script>
