<template>
    <document-view-container
        v-if="document"
        :document="document"
        :locale="locale"

        :version="version"
        :previous-version-id="previousVersionId"
        :next-version-id="nextVersionId">

        <div class="columns">
            <div class="column is-3">

                <map-box :document="document"/>

                <associated-waypoints :document="document" />
                <associated-books :document="document" />
                <associated-articles :document="document" />
                <associated-maps :document="document" />
                <lang-switcher-box :document="document" />

                <license-box cc="by-sa" />

            </div>

            <div class="column is-9">
                <!--   CONTENT  -->

                <content-box>
                    <div class="columns">

                        <div class="column is-4">

                            <label-value label="activities">
                                <activities :activities="document.activities" class="is-size-3 has-text-primary"/>
                            </label-value>

                            <label-value v-if="document.route_types" label="route type">
                                {{ document.route_types.join(', ') }}
                            </label-value>

                            <field-view :document="document" :field="fields.durations"/>
                            <field-view :document="document" :field="fields.rock_types" />
                            <field-view :document="document" :field="fields.climbing_outdoor_type" />
                            <field-view :document="document" :field="fields.configuration" />
                            <field-view :document="document" :field="fields.slackline_type"/>
                        </div>

                        <div class="column is-4">

                            <label-value label="ratings">
                                <route-rating :document="document"/>
                            </label-value>

                            <field-view :document="document" :field="fields.glacier_gear"/>

                            <input-orientation v-if="document.orientations && document.orientations.length" v-model="document.orientations" read-only/>

                        </div>

                        <div class="column is-4">

                            <div v-if="document.elevation_min || document.elevation_max">
                                <label class="has-text-weight-bold">
                                    <span class="is-first-letter-uppercase">elevation&nbsp;</span>
                                    <span v-if="document.elevation_min">min</span><span v-if="document.elevation_min && document.elevation_max">/</span><span v-if="document.elevation_max">max</span>
                                </label>
                                :
                                <span v-if="document.elevation_min">{{ document.elevation_min }}&#8239;m</span>
                                <span v-if="document.elevation_min && document.elevation_max">/</span>
                                <span v-if="document.elevation_max">{{ document.elevation_max }}&#8239;m</span>
                            </div>

                            <label-value v-if="document.height_diff_up || document.height_diff_down" label="height difference">
                                <span v-if="document.height_diff_up">+{{ document.height_diff_up }}&#8239;m</span>
                                <span v-if="document.height_diff_up && document.height_diff_down">/</span>
                                <span v-if="document.height_diff_down">-{{ document.height_diff_down }}&#8239;m</span>
                            </label-value>

                            <field-view :document="document" :field="fields.height_diff_difficulties"/>
                            <field-view :document="document" :field="fields.difficulties_height"/>

                            <field-view :document="document" :field="fields.height_diff_access"/>
                            <field-view :document="document" :field="fields.lift_access"/>

                            <field-view :document="document" :field="fields.route_length"/>
                            <field-view :document="document" :field="fields.mtb_height_diff_portages"/>
                            <field-view :document="document" :field="fields.mtb_length_asphalt"/>
                            <field-view :document="document" :field="fields.mtb_length_trail"/>

                            <label-value v-if="locale.slope" label="slope">
                                {{ locale.slope }}
                            </label-value>

                            <field-view :document="document" :field="fields.slackline_height"/>

                        </div>
                    </div>
                </content-box>

                <content-box>
                    <markdown-section :document="document" :locale="locale" :field="fields.summary"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.route_history" />
                    <markdown-section :document="document" :locale="locale" :field="fields.description" />
                    <markdown-section :document="document" :locale="locale" :field="fields.slackline_anchor1" />
                    <markdown-section :document="document" :locale="locale" :field="fields.slackline_anchor2" />
                    <markdown-section :document="document" :locale="locale" :field="fields.remarks" />
                    <markdown-section :document="document" :locale="locale" :field="fields.gear" />
                    <markdown-section :document="document" :locale="locale" :field="fields.external_resources" />

                    <gallery
                        v-if="document.associations && document.associations.images.length"
                        :images="document.associations.images" />

                </content-box>

                <recent-outings-box :document="document"/>

                <comments-box
                    :document="document"
                    :locale="locale"/>

            </div>
        </div>
    </document-view-container>
</template>

<script>
    import mixins from "./utils/mixins.js"

    export default {
        mixins : [
            mixins,
        ],
    }
</script>
