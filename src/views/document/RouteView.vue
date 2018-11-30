<template>
    <div class="section">

        <document-view-header :document="document" :version="version" :promise="promise" />
        <div v-if="document" class="columns">

            <div class="column is-3">
                <map-box :document="document"/>
                <tool-box :document="document"/>
            </div>

            <div class="column is-9">
                <!--   CONTENT  -->

                <div class="box">
                    <div class="columns">

                        <div class="column is-4">

                            <label-value :label="$gettext('activities')">
                                <activities :activities="document.activities" class="is-size-3 has-text-primary"/>
                            </label-value>

                            <field-view :document="document" :field="fields.route_types" />
                            <field-view :document="document" :field="fields.durations" :unit="$gettext('day(s)')"/>
                            <field-view :document="document" :field="fields.rock_types" />
                            <field-view :document="document" :field="fields.climbing_outdoor_type" />
                            <field-view :document="document" :field="fields.configuration" />
                            <field-view :document="document" :field="fields.slackline_type"/>
                        </div>

                        <div class="column is-4">

                            <label-value :label="$gettext('ratings')">
                                <route-rating v-if="$documentUtils.hasRating(document)" :document="document"/>
                                <edit-link v-else :document="document" :lang="$user.lang"/>
                            </label-value>

                            <field-view v-if="document.glacier_gear!='no'" :document="document" :field="fields.glacier_gear"/>

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

                            <label-value v-if="document.cooked.slope" :label="$gettext('slope')">
                                {{ document.cooked.slope }}
                            </label-value>

                            <field-view :document="document" :field="fields.slackline_height"/>

                        </div>
                    </div>
                </div>

                <div class="box">
                    <markdown-section :document="document" :field="fields.summary"/>
                    <markdown-section :document="document" :field="fields.route_history" />
                    <markdown-section :document="document" :field="fields.description" />
                    <markdown-section :document="document" :field="fields.slackline_anchor1" />
                    <markdown-section :document="document" :field="fields.slackline_anchor2" />
                    <markdown-section :document="document" :field="fields.remarks" />
                    <markdown-section :document="document" :field="fields.gear" />

                    <div class="content">
                        <ul>
                            <li v-for="(label, articleId) of gear_articles" :key="articleId">
                                <router-link :to="{ name: 'article', params: {id: articleId} }">
                                    {{ label }}
                                </router-link>
                            </li>
                        </ul>
                    </div>

                    <markdown-section :document="document" :field="fields.external_resources" />

                </div>

                <routes-box :document="document" hide-buttons />
                <images-box :document="document" />

                <recent-outings-box :document="document" />

                <comments-box :document="document"/>

            </div>
        </div>
    </div>
</template>

<script>
    import DocumentViewMixin from "./utils/DocumentViewMixin.js"

    export default {
        mixins : [ DocumentViewMixin ],

        computed: {
            // https://github.com/c2corg/v6_ui/blob/master/c2corg_ui/templates/utils/__init__.py#L103
            gear_articles(){

                const result = {}
                const doc = this.document
                const activities = doc.activities || []
                const easy_mountain = ['F', 'F+', 'PD-', 'PD', 'PD+', 'AD-', 'AD' ]
                const poor_equiped = ['P2', 'P2+', 'P3', 'P3+', 'P4' ]
                const glacier_activities = ['mountain_climbing', 'skitouring', 'snow_ice_mixed', 'snowshoeing' ]

                if(activities.includes('snowshoeing') || activities.includes('skitouring'))
                    result['183333'] = this.$gettext('skitouring gear')

                if(activities.includes('snow_ice_mixed') && ['F', 'F+', 'PD-', 'PD', 'PD+'].includes(doc.global_rating))
                    result['185750'] = this.$gettext('easy snow ice mixed gear')

                if(activities.includes('mountain_climbing') && easy_mountain.includes(doc.global_rating))
                    result['185384'] = this.$gettext('easy mountain climbing gear')

                if(activities.includes('rock_climbing')){
                    if(['P1', 'P1+'].includes(doc.equipment_rating))
                        result['183332'] = this.$gettext('bolted rock climbing gear')

                    else if(!activities.includes('mountain_climbing')  &&
                        easy_mountain.includes(doc.global_rating) &&
                        poor_equiped.includes(doc.equipment_rating))
                        result['185384'] = this.$gettext('easy mountain climbing gear')
                }

                if(activities.includes('ice_climbing'))
                    result['194479'] = this.$gettext('ice and dry climbing gear')

                if(activities.includes('hiking'))
                    result['185207'] = this.$gettext('hiking gear')

                // we should use an anchor for glacier gear, but it's not possible
                if(doc.glacier_gear && doc.glacier_gear != 'no')
                    if(activities.filter(act => glacier_activities.includes(act)))
                        result['185750'] = this.$gettext('easy snow ice mixed gear')

                return result
            }
        }
    }
</script>
