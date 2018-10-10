<template>
    <document-view-container
        v-if="document"
        :document="document"
        :locale="locale"

        :version="version"
        :previous-version-id="previousVersionId"
        :next-version-id="nextVersionId">

        <div>
            <!--  CONTENT http://localhost:8080/outings/714134  -->

            <content-box v-if="document.associations && document.associations.images.length" >
                <gallery :images="document.associations.images" />
            </content-box>

            <div class="columns">

                <div class="column is-3">
                    <map-box :document="document"/>

                    <elevation-profile-box :document="document"/>

                    <license-box cc="by-sa" />
                </div>

                <div class="column is-9">

                    <content-box>
                        <div>
                            <users-links :users="document.associations.users"/>
                            {{ locale.participants }}
                        </div>

                        <div v-for="route of document.associations.routes" :key="route.document_id">
                            <pretty-route-link :route="route"/>
                        </div>

                        <div class="columns">

                            <div class="column is-4">
                                <label-value :label="$gettext('activities')">
                                    <activities :activities="document.activities" class="is-size-3 has-text-primary"/>
                                </label-value>

                                <field-view :document="document" :field="fields.frequentation"/>
                                <field-view :document="document" :field="fields.condition_rating"/>
                                <field-view :document="document" :field="fields.quality"/>

                                <field-view :document="document" :field="fields.participant_count"/>
                            </div>

                            <div class="column is-4">
                                <label-value :label="$gettext('ratings')">
                                    <outing-rating :outing="document"/>
                                </label-value>

                                <field-view :document="document" :field="fields.access_condition"/>
                                <field-view :document="document" :field="fields.lift_status"/>
                                <field-view :document="document" :field="fields.hut_status"/>

                            </div>

                            <div class="column is-4">
                                <double-numeric-field
                                    :document="document"
                                    :field1="fields.elevation_min"
                                    :field2="fields.elevation_max"
                                    :label="$gettext('elevation')" />

                                <field-view :document="document" :field="fields.elevation_access"/>

                                <double-numeric-field
                                    :document="document"
                                    :field1="fields.height_diff_up"
                                    :field2="fields.height_diff_down"
                                    :label="$gettext('height difference')" />

                                <field-view :document="document" :field="fields.length_total"/>

                                <field-view :document="document" :field="fields.elevation_up_snow"/>
                                <field-view :document="document" :field="fields.elevation_down_snow"/>

                                <field-view :document="document" :field="fields.snow_quantity"/>
                                <field-view :document="document" :field="fields.snow_quality"/>

                                <field-view :document="document" :field="fields.glacier_rating"/>
                                <field-view :document="document" :field="fields.avalanche_signs"/>

                            </div>
                        </div>
                    </content-box>


                    <content-box>

                        <markdown-section :document="document" :locale="locale" :field="fields.weather"/>
                        <markdown-section :document="document" :locale="locale" :field="fields.conditions"/>

                        <condition-levels :data="locale.conditions_levels"/>

                        <markdown-section :document="document" :locale="locale" :field="fields.avalanches"/>
                        <markdown-section :document="document" :locale="locale" :field="fields.description" />
                        <markdown-section :document="document" :locale="locale" :field="fields.access_comment" />
                        <markdown-section :document="document" :locale="locale" :field="fields.route_description" />
                        <markdown-section :document="document" :locale="locale" :field="fields.hut_comment"/>
                        <markdown-section :document="document" :locale="locale" :field="fields.timing"/>

                    </content-box>

                    <comments-box :document="document" :locale="locale" />

                </div>
            </div>
        </div>
    </document-view-container>
</template>

<script>
    import mixins from "./utils/mixins.js"
    import ConditionLevels from "./utils/fieldViewers/ConditionLevels"
    import ElevationProfileBox from "./utils/boxes/ElevationProfileBox"

    export default {

        components:{
            ConditionLevels,
            ElevationProfileBox,
        },

        mixins : [
            mixins,
        ],
    }
</script>
