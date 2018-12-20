<template>
    <div class="section">
        <document-view-header :document="document" :version="version" :promise="promise">
            <icon-waypoint-type v-if="document" slot="icon-document" :waypoint-type="document.waypoint_type"/>
        </document-view-header>

        <div v-if="document" class="columns">
            <div class="column is-3">
                <map-box :document="document" />
                <tool-box :document="document" />
            </div>

            <div class="column is-9">
                <div class="box">
                    <div class="columns is-multiline">
                        <div class="column is-4">

                            <!-- General  -->
                            <field-view :document="document" :field="fields.elevation"/>
                            <field-view :document="document" :field="fields.waypoint_type"/>
                            <field-view :document="document" :field="fields.climbing_indoor_types"/>
                            <field-view :document="document" :field="fields.rock_types"/>
                            <field-view :document="document" :field="fields.slackline_types"/>
                            <field-view :document="document" :field="fields.climbing_outdoor_types"/>
                            <field-view :document="document" :field="fields.product_types"/>
                            <field-view :document="document" :field="fields.ground_types"/>
                            <field-view :document="document" :field="fields.weather_station_types"/>
                            <field-view :document="document" :field="fields.rain_proof"/>
                            <field-view :document="document" :field="fields.children_proof"/>
                            <field-view :document="document" :field="fields.capacity"/>
                            <field-view :document="document" :field="fields.capacity_staffed"/>
                            <field-view :document="document" :field="fields.length"/>
                            <double-numeric-field
                                :document="document"
                                :field1="fields.slackline_length_min"
                                :field2="fields.slackline_length_max"
                                :label="$gettext('slackline length')" />
                            <field-view :document="document" :field="fields.routes_quantity"/>
                            <field-view :document="document" :field="fields.best_periods"/>
                            <field-view :document="document" :field="fields.quality"/>

                        </div>

                        <div class="column is-4">

                            <!-- orientation -->
                            <input-orientation
                                v-if="document.orientations && document.orientations.length"
                                v-model="document.orientations"
                                disabled/>

                            <!-- contact -->
                            <field-view :document="document" :field="fields.url"/>
                            <field-view :document="document" :field="fields.phone"/>
                            <field-view :document="document" :field="fields.custodianship"/>
                            <field-view :document="document" :field="fields.phone_custodian"/>

                            <!-- RATING -->
                            <double-numeric-field
                                :document="document"
                                :field1="fields.climbing_rating_min"
                                :field2="fields.climbing_rating_max"
                                :label="$gettext('climbing rating')" />
                            <field-view :document="document" :field="fields.climbing_rating_median"/>
                            <field-view :document="document" :field="fields.equipment_ratings"/>
                            <field-view :document="document" :field="fields.paragliding_rating"/>
                            <field-view :document="document" :field="fields.exposition_rating"/>

                            <!-- heights -->
                            <field-view :document="document" :field="fields.prominence"/>
                            <field-view :document="document" :field="fields.elevation_min"/>
                            <double-numeric-field
                                :document="document"
                                :field1="fields.height_min"
                                :field2="fields.height_max"
                                :label="$gettext('height')" />
                            <field-view :document="document" :field="fields.height_median"/>
                        </div>

                        <div class="column is-4">

                            <!-- equipment -->
                            <field-view :document="document" :field="fields.matress_unstaffed"/>
                            <field-view :document="document" :field="fields.blanket_unstaffed"/>
                            <field-view :document="document" :field="fields.heating_unstaffed"/>
                            <field-view :document="document" :field="fields.gas_unstaffed"/>

                            <!-- style -->
                            <field-view :document="document" :field="fields.climbing_styles"/>

                            <!-- access -->
                            <field-view :document="document" :field="fields.access_time"/>
                            <field-view :document="document" :field="fields.public_transportation_types"/>
                            <field-view :document="document" :field="fields.public_transportation_rating"/>
                            <field-view :document="document" :field="fields.parking_fee"/>
                            <field-view :document="document" :field="fields.snow_clearance_rating"/>
                            <field-view :document="document" :field="fields.lift_access"/>

                        </div>
                    </div>
                </div>

                <div class="box" v-if="locale.description || locale.access || locale.summary || locale.access_period">
                    <markdown-section :document="document" :field="fields.summary" />
                    <markdown-section :document="document" :field="fields.description" />
                    <markdown-section :document="document" :field="fields.access" :title="accessFieldTitle"/>
                    <markdown-section :document="document" :field="fields.access_period" :title="accessPeriodFieldTitle" />
                </div>

                <div class="box" v-if="document.associations.waypoint_children.length">
                    <h2 class="title is-2" v-translate>
                        Waypoints children
                    </h2>
                    <div v-for="child of document.associations.waypoint_children" :key="child.document_id">
                        <pretty-waypoint-link :waypoint="child" />
                    </div>
                </div>

                <routes-box :document="document"/>

                <recent-outings-box :document="document"/>

                <images-box :document="document" ref="imagesBox"/>

                <comments-box :document="document" />
            </div>
        </div>
    </div>
</template>

<script>
    import DocumentViewMixin from './utils/DocumentViewMixin.js'

    export default {
        mixins: [ DocumentViewMixin ],

        computed: {
            // https://github.com/c2corg/v6_ui/blob/f7b8794648e475240fc63bbff7ff6bdbd3968746/c2corg_ui/templates/waypoint/helpers/view.html#L425
            accessFieldTitle() {
                if (this.document.waypoint_type === 'access') {
                    return this.$gettext('public transportation access')
                }

                if (['hut', 'climbing_indoor', 'climbing_outdoor'].includes(this.document.waypoint_type)) {
                    return this.$gettext('pedestrian access')
                }

                return this.$gettext('road or pedestrian access')
            },

            accessPeriodFieldTitle() {
                if (['hut', 'gite', 'camp_site'].includes(this.document.waypoint_type)) {
                    return this.$gettext('opening_periods')
                }

                if (this.waypoint_type === 'local_product') {
                    return this.$gettext('opening_hours')
                }

                if (this.waypoint_type === 'climbing_outdoor') {
                    return this.$gettext('restricted_access')
                }

                return this.$gettext('access_period')
            }
        }
    }
</script>
