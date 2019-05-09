<template>
  <div class="section has-background-white-print">
    <document-view-header :document="document" :version="version" :promise="promise">
      <icon-waypoint-type
        v-if="document && document.waypoint_type"
        slot="icon-document"
        :waypoint-type="document.waypoint_type" />
    </document-view-header>

    <div v-if="document" class="wrapper">
      <div class="item1 no-print">
        <map-box :document="document" />
      </div>

      <div class="item2 is-12-print">
        <div class="box">
          <div class="columns is-multiline">
            <div class="column is-4">

              <!-- General  -->
              <field-view :document="document" :field="fields.elevation" />
              <field-view :document="document" :field="fields.waypoint_type" />
              <field-view :document="document" :field="fields.climbing_indoor_types" />
              <field-view :document="document" :field="fields.rock_types" />
              <field-view :document="document" :field="fields.slackline_types" />
              <field-view :document="document" :field="fields.climbing_outdoor_types" />
              <field-view :document="document" :field="fields.product_types" />
              <field-view :document="document" :field="fields.ground_types" />
              <field-view :document="document" :field="fields.weather_station_types" />
              <field-view :document="document" :field="fields.rain_proof" />
              <field-view :document="document" :field="fields.children_proof" />
              <field-view :document="document" :field="fields.capacity" v-if="document.capacity" />
              <field-view :document="document" :field="fields.capacity_staffed" />
              <field-view :document="document" :field="fields.length" />
              <double-numeric-field
                :document="document"
                :field1="fields.slackline_length_min"
                :field2="fields.slackline_length_max"
                :label="$gettext('slackline_length')" />
              <field-view :document="document" :field="fields.routes_quantity" />
              <field-view :document="document" :field="fields.best_periods" />
              <field-view :document="document" :field="fields.quality" />

            </div>

            <div class="column is-4">

              <!-- orientation -->
              <input-orientation
                v-if="document.orientations && document.orientations.length"
                v-model="document.orientations"
                disabled />

              <!-- contact -->
              <field-view :document="document" :field="fields.url" />
              <field-view :document="document" :field="fields.phone" />
              <field-view :document="document" :field="fields.custodianship" />
              <field-view :document="document" :field="fields.phone_custodian" />

              <!-- RATING -->
              <double-numeric-field
                :document="document"
                :field1="fields.climbing_rating_min"
                :field2="fields.climbing_rating_max"
                :label="$gettext('climbing rating')" />
              <field-view :document="document" :field="fields.climbing_rating_median" />
              <field-view :document="document" :field="fields.equipment_ratings" />
              <field-view :document="document" :field="fields.paragliding_rating" />
              <field-view :document="document" :field="fields.exposition_rating" />

              <!-- heights -->
              <field-view :document="document" :field="fields.prominence" />
              <field-view :document="document" :field="fields.elevation_min" />
              <double-numeric-field
                :document="document"
                :field1="fields.height_min"
                :field2="fields.height_max"
                :label="$gettext('height')" />
              <field-view :document="document" :field="fields.height_median" />
            </div>

            <div class="column is-4">

              <!-- equipment -->
              <field-view :document="document" :field="fields.matress_unstaffed" />
              <field-view :document="document" :field="fields.blanket_unstaffed" />
              <field-view :document="document" :field="fields.heating_unstaffed" />
              <field-view :document="document" :field="fields.gas_unstaffed" />

              <!-- style -->
              <field-view :document="document" :field="fields.climbing_styles" />

              <!-- access -->
              <field-view :document="document" :field="fields.access_time" />
              <field-view :document="document" :field="fields.public_transportation_types" />
              <field-view :document="document" :field="fields.public_transportation_rating" />
              <field-view :document="document" :field="fields.parking_fee" />
              <field-view :document="document" :field="fields.snow_clearance_rating" />
              <field-view :document="document" :field="fields.lift_access" />

            </div>
          </div>
        </div>

        <div class="box" v-if="locale.summary || locale.access_period || locale.description || locale.access">
          <markdown-section :document="document" :field="fields.summary" />
          <markdown-section :document="document" :field="fields.access_period" :title="accessPeriodTitle" />
          <markdown-section :document="document" :field="fields.description" :title="descriptionTitle" />
          <markdown-section :document="document" :field="fields.access" :title="accessTitle" />
          <div style="clear:both" />
        </div>

        <routes-box v-if="!isDraftView" :document="document" />
        <recent-outings-box v-if="!isDraftView" :document="document" />
        <images-box v-if="!isDraftView" :document="document" />
        <comments-box v-if="!isDraftView" :document="document" />
      </div>

      <div class="item3">
        <tool-box :document="document" />
      </div>
    </div>
  </div>
</template>

<script>
  import documentViewMixin from './utils/document-view-mixin.js';
  import waypointLabels from '@/js/waypoint-labels-mixin.js';

  export default {
    mixins: [ documentViewMixin, waypointLabels ]
  };
</script>
