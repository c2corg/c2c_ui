<template>
  <div class="section has-background-white-print">
    <document-view-header :document="document" :version="version" :promise="promise" />
    <div v-if="document" class="wrapper is-block-print">
      <div class="item1 is-12-print">

        <div class="box">
          <activities-field :document="document" />
          <label-value v-if="document.author" :label="$gettext('contributor')">
            <contributor-link :contributor="document.author" />
          </label-value>

          <field-view :document="document" :field="fields.event_type" />

          <label-value v-if="document.associations.users.length" :label="$gettext('participants')">
            <profiles-links :profiles="document.associations.users" />
          </label-value>

          <field-view :document="document" :field="fields.avalanche_level" />
          <field-view :document="document" :field="fields.avalanche_slope" />
          <field-view :document="document" :field="fields.elevation" />
          <field-view :document="document" :field="fields.nb_participants" />
          <field-view :document="document" :field="fields.nb_impacted" />
          <field-view :document="document" :field="fields.rescue" />
          <field-view :document="document" :field="fields.severity" />
          <field-view :document="document" :field="fields.quality" />
        </div>

        <map-box :document="document" />
      </div>

      <div class="item2">
        <div class="box">
          <markdown-section :document="document" :field="fields.summary" />
          <markdown-section :document="document" :field="fields.description" />
          <markdown-section :document="document" :field="fields.place" />
          <markdown-section :document="document" :field="fields.route_study" />
          <markdown-section :document="document" :field="fields.conditions" />
          <markdown-section :document="document" :field="fields.training" />
          <markdown-section :document="document" :field="fields.motivations" />
          <markdown-section :document="document" :field="fields.group_management" />
          <markdown-section :document="document" :field="fields.risk" />
          <markdown-section :document="document" :field="fields.time_management" />
          <markdown-section :document="document" :field="fields.safety" />
          <markdown-section :document="document" :field="fields.increase_impact" />
          <markdown-section :document="document" :field="fields.reduce_impact" />
          <markdown-section :document="document" :field="fields.modifications" />
          <markdown-section :document="document" :field="fields.other_comments" />
          <div style="clear:both" />
        </div>

        <images-box v-if="document" :document="document" />

        <comments-box :document="document" />

      </div>

      <div class="item3">
        <tool-box :document="document" />
      </div>
    </div>
  </div>
</template>

<script>
  import documentViewMixin from './utils/document-view-mixin.js';

  export default {
    mixins: [ documentViewMixin ]
  };
</script>
