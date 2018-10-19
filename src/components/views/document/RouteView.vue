<template>
    <view-container>
        <template slot-scope="{ document, fields }">

            <div class="columns">
                <div class="column is-3">

                    <map-box :document="document"/>

                    <associated-documents :document="document" />

                    <lang-switcher-box :document="document" />

                    <license-box cc="by-sa" />

                </div>

                <div class="column is-9">
                    <!--   CONTENT  -->

                    <content-box>
                        <div class="columns">

                            <div class="column is-4">

                                <label-value :label="$gettext('activities')">
                                    <activities :activities="document.activities" class="is-size-3 has-text-primary"/>
                                </label-value>

                                <field-view :document="document" :field="fields.route_types" />
                                <field-view :document="document" :field="fields.durations"/>
                                <field-view :document="document" :field="fields.rock_types" />
                                <field-view :document="document" :field="fields.climbing_outdoor_type" />
                                <field-view :document="document" :field="fields.configuration" />
                                <field-view :document="document" :field="fields.slackline_type"/>
                            </div>

                            <div class="column is-4">

                                <label-value :label="$gettext('ratings')">
                                    <!-- TODO : hide is no cotation -->
                                    <route-rating :document="document"/>
                                </label-value>

                                <field-view :document="document" :field="fields.glacier_gear"/>

                                <input-orientation
                                    v-if="document.orientations && document.orientations.length"
                                    v-model="document.orientations"
                                    disabled/>

                            </div>

                            <div class="column is-4">

                                <double-numeric-field
                                    :document="document"
                                    :field1="fields.elevation_min"
                                    :field2="fields.elevation_max"
                                    :label="$gettext('elevation')" />

                                <double-numeric-field
                                    :document="document"
                                    :field1="fields.height_diff_up"
                                    :field2="fields.height_diff_down"
                                    :label="$gettext('height difference')" />

                                <field-view :document="document" :field="fields.height_diff_difficulties"/>
                                <field-view :document="document" :field="fields.difficulties_height"/>

                                <field-view :document="document" :field="fields.height_diff_access"/>
                                <field-view :document="document" :field="fields.lift_access"/>

                                <field-view :document="document" :field="fields.route_length"/>
                                <field-view :document="document" :field="fields.mtb_height_diff_portages"/>
                                <field-view :document="document" :field="fields.mtb_length_asphalt"/>
                                <field-view :document="document" :field="fields.mtb_length_trail"/>

                                <label-value v-if="document.currentLocale_.slope" :label="$gettext('slope')">
                                    {{ document.currentLocale_.slope }}
                                </label-value>

                                <field-view :document="document" :field="fields.slackline_height"/>

                            </div>
                        </div>
                    </content-box>

                    <content-box>
                        <markdown-section :document="document" :field="fields.summary"/>
                        <markdown-section :document="document" :field="fields.route_history" />
                        <markdown-section :document="document" :field="fields.description" />
                        <markdown-section :document="document" :field="fields.slackline_anchor1" />
                        <markdown-section :document="document" :field="fields.slackline_anchor2" />
                        <markdown-section :document="document" :field="fields.remarks" />
                        <markdown-section :document="document" :field="fields.gear" />
                        <markdown-section :document="document" :field="fields.external_resources" />

                        <gallery
                            v-if="document.associations && document.associations.images.length"
                            :images="document.associations.images" />

                    </content-box>

                    <recent-outings-box :document="document"/>

                    <comments-box :document="document"/>

                </div>
            </div>
        </template>
    </view-container>
</template>

<script>
    import viewComponentsMixin from "./utils/viewComponentsMixin.js"

    export default {
        mixins : [ viewComponentsMixin ],
    }
</script>
