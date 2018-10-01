<template>
    <document-view-container
        v-if="document"
        :document="document"
        :locale="locale"

        :version="version"
        :previous-version-id="previousVersionId"
        :next-version-id="nextVersionId"

        uploaded-image-type="personal">

        <div>
            <!--  CONTENT http://localhost:8080/outings/714134  -->

            <content-box v-if="document.associations && document.associations.images.length" >
                <gallery :images="document.associations.images" />
            </content-box>

            <div class="columns">

                <div class="column is-3">
                    <content-box>

                        <label-value label="activities">
                            <activities :activities="document.activities" class="is-size-3 has-text-primary"/>
                        </label-value>

                        <label-value label="ratings">
                            <outing-rating :outing="document"/>
                        </label-value>

                        <field-view :document="document" :field="fields.frequentation"/>

                        <label-value v-if="document.elevation_min || document.elevation_max" label="elevation">
                            <span v-if="document.elevation_min">{{ document.elevation_min }}&nbsp;m</span>
                            <span v-if="document.elevation_min && document.elevation_max">/</span>
                            <span v-if="document.elevation_max">{{ document.elevation_max }}&nbsp;m</span>
                        </label-value>

                        <label-value v-if="document.height_diff_down || document.height_diff_up" label="height difference">
                            <span v-if="document.height_diff_up">+{{ document.height_diff_up }}&nbsp;m</span>
                            <span v-if="document.height_diff_up && document.height_diff_down">/</span>
                            <span v-if="document.height_diff_down">-{{ document.height_diff_down }}&nbsp;m</span>
                        </label-value>

                        <field-view :document="document" :field="fields.length_total"/>
                        <field-view :document="document" :field="fields.hut_status"/>
                        <field-view :document="document" :field="fields.snow_quality"/>
                        <field-view :document="document" :field="fields.snow_quantity"/>

                    </content-box>

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

                        <pretty-route-link v-for="route of document.associations.routes" :key="route.document_id"
                                           :route="route"/>

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
    import ConditionLevels from "./utils/ConditionLevels"
    import ElevationProfileBox from "./utils/ElevationProfileBox"

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
