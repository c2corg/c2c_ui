<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">

        <tab-view>

            <tab-item :title="$gettext('general informations')">
                <field-simple :document="document" :base="locale" :field="fields.title"/>
                <field-simple :document="document" :field="fields.waypoint_type" />

                <field-simple :document="document" :field="fields.elevation" />
                <field-simple :document="document" :field="fields.elevation_min" />
                <field-simple :document="document" :field="fields.prominence" />

                <field-row label="" always-visible>
                    <map-view  :documents="[document]" editable/>
                </field-row>

                <field-simple :document="document" :field="fields.maps_info" />

            </tab-item>

            <tab-item :title="$gettext('Transport &amp; road or PT access')">
                <field-simple :document="document" :field="fields.snow_clearance_rating" />
                <field-simple :document="document" :field="fields.lift_access" />
                <field-simple :document="document" :field="fields.public_transportation_rating" />
                <field-simple :document="document" :field="fields.parking_fee" />
            </tab-item>

            <tab-item :title="$gettext('Types and styles')">
                <field-simple :document="document" :field="fields.rock_types" />
                <field-simple :document="document" :field="fields.climbing_styles" />
                <field-simple :document="document" :field="fields.climbing_outdoor_types" />
                <field-simple :document="document" :field="fields.climbing_indoor_types" />
                <field-simple :document="document" :field="fields.best_periods" />
                <field-simple :document="document" :field="fields.access_time" />
                <field-simple :document="document" :field="fields.rain_proof" />
                <field-simple :document="document" :field="fields.children_proof" />
                <field-simple :document="document" :field="fields.orientations" />
                <field-simple :document="document" :field="fields.ground_types" />

                <field-simple :document="document" :field="fields.product_types" />

                <field-simple :document="document" :field="fields.slackline_types" />

                <!-- TODO : retrouver ou il est celui la -->
                <field-simple :document="document" :field="fields.public_transportation_types" />

            </tab-item>

            <tab-item :title="$gettext('Numbers')">
                <field-simple :document="document" :field="fields.length" />
                <field-simple :document="document" :field="fields.slope" />
                <field-simple :document="document" :field="fields.custodianship" />
                <field-simple :document="document" :field="fields.capacity_staffed" />
                <field-simple :document="document" :field="fields.capacity" />
                <field-simple :document="document" :field="fields.matress_unstaffed" />
                <field-simple :document="document" :field="fields.blanket_unstaffed" />
                <field-simple :document="document" :field="fields.gas_unstaffed" />
                <field-simple :document="document" :field="fields.heating_unstaffed" />

                <field-row :label="$gettext('height')">
                    <field-input :document="document" :field="fields.height_min" prefix="min"/>
                    <field-input :document="document" :field="fields.height_median" prefix="median"/>
                    <field-input :document="document" :field="fields.height_max" prefix="max"/>
                </field-row>

                <field-simple :document="document" :field="fields.routes_quantity" />

                <field-simple :document="document" :field="fields.slackline_length_max" />
                <field-simple :document="document" :field="fields.slackline_length_min" />

            </tab-item>

            <tab-item :title="$gettext('ratings')">
                <field-simple :document="document" :field="fields.equipment_ratings" />

                <field-row :label="$gettext('ratings')">
                    <field-input :document="document" :field="fields.climbing_rating_min" prefix="min"/>
                    <field-input :document="document" :field="fields.climbing_rating_median" prefix="median"/>
                    <field-input :document="document" :field="fields.climbing_rating_max" prefix="max"/>
                </field-row>

                <field-simple :document="document" :field="fields.paragliding_rating" />
                <field-simple :document="document" :field="fields.exposition_rating" />
            </tab-item>

            <tab-item :title="$gettext('Contact')">
                <field-simple :document="document" :field="fields.url" />
                <field-simple :document="document" :field="fields.phone" />
                <field-simple :document="document" :field="fields.phone_custodian" />
            </tab-item>

            <tab-item :title="$gettext('Description')">

                <field-simple :document="document" :base="locale" :field="fields.summary"/>
                <field-simple :document="document" :base="locale" :field="fields.description"/>
                <field-simple :document="document" :base="locale" :field="fields.access"/>
                <field-simple :document="document" :base="locale" :field="fields.access_period"/>

            </tab-item>
        </tab-view>
    </edition-container>
</template>

<script>

    import mixins from './utils/mixins.js'

    export default {
        mixins : [
            mixins,
        ],
    }
</script>

<style scoped>
</style>
