<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">
        <div>

            <edit-section header="title">
                <input-base :document="document" :base="locale" :field="fields.title" class="is-9"/>
                <input-base :document="document" :field="fields.waypoint_type" class="is-3" />
            </edit-section>

            <edit-section header="geolocation">
                <input-base :document="document" :field="fields.elevation" class="is-4" />
                <input-base :document="document" :field="fields.elevation_min" class="is-4" />
                <input-base :document="document" :field="fields.prominence" class="is-4" />
                <input-base :document="document" :field="fields.maps_info" class="is-4" />
            </edit-section>

            <edit-section header="Transport &amp; road or PT access">
                <input-base :document="document" :field="fields.snow_clearance_rating" class="is-4" />
                <input-base :document="document" :field="fields.lift_access" class="is-4" />
                <input-base :document="document" :field="fields.public_transportation_rating" class="is-4" />
                <input-base :document="document" :field="fields.parking_fee" class="is-4" />
            </edit-section>

            <edit-section header="Types and styles">
                <input-checkboxes :document="document" :field="fields.rock_types" class="is-6" />
                <input-checkboxes :document="document" :field="fields.climbing_styles" class="is-6" />
                <input-checkboxes :document="document" :field="fields.climbing_outdoor_types" class="is-4" />
                <input-checkboxes :document="document" :field="fields.climbing_indoor_types" class="is-6" />
                <input-checkboxes :document="document" :field="fields.best_periods" class="is-4" />
                <input-base :document="document" :field="fields.access_time" class="is-4" />
                <input-base :document="document" :field="fields.rain_proof" class="is-4" />
                <input-base :document="document" :field="fields.children_proof" class="is-4" />
                <input-base :document="document" :field="fields.orientations" class="is-4" />
                <input-base :document="document" :field="fields.ground_types" class="is-4" />

                <input-base :document="document" :field="fields.product_types" class="is-4" />

                <input-base :document="document" :field="fields.slackline_types" class="is-4" />

                <!-- TODO : retrouver ou il est celui la -->
                <input-base :document="document" :field="fields.public_transportation_types" class="is-4" />

            </edit-section>

            <edit-section header="Numbers">
                <input-base :document="document" :field="fields.length" class="is-4" />
                <input-base :document="document" :field="fields.slope" class="is-4" />
                <input-base :document="document" :field="fields.capacity" class="is-4" />
                <input-base :document="document" :field="fields.custodianship" class="is-4" />
                <input-base :document="document" :field="fields.capacity_staffed" class="is-4" />
                <input-base :document="document" :field="fields.height_max" class="is-3" />
                <input-base :document="document" :field="fields.height_min" class="is-3" />
                <input-base :document="document" :field="fields.height_median" class="is-3" />
                <input-base :document="document" :field="fields.routes_quantity" class="is-3" />

                <input-base :document="document" :field="fields.slackline_length_max" class="is-4" />
                <input-base :document="document" :field="fields.slackline_length_min" class="is-4" />

            </edit-section>

            <edit-section header="ratings">
                <input-checkboxes :document="document" :field="fields.equipment_ratings" class="is-4" />
                <input-base :document="document" :field="fields.climbing_rating_min" class="is-4" />
                <input-base :document="document" :field="fields.climbing_rating_max" class="is-4" />
                <input-base :document="document" :field="fields.climbing_rating_median" class="is-4" />

                <input-base :document="document" :field="fields.paragliding_rating" class="is-6" />
                <input-base :document="document" :field="fields.exposition_rating" class="is-6" />
            </edit-section>

            <edit-section header="Equipement">
                <!-- TODO radio -->
                <input-base :document="document" :field="fields.matress_unstaffed" class="is-3" />
                <input-base :document="document" :field="fields.blanket_unstaffed" class="is-3" />
                <input-base :document="document" :field="fields.gas_unstaffed" class="is-3" />
                <input-base :document="document" :field="fields.heating_unstaffed" class="is-3" />
            </edit-section>

            <edit-section header="Contact">
                <input-base :document="document" :field="fields.url" class="is-8" />
                <input-base :document="document" :field="fields.phone" class="is-4" />
                <input-base :document="document" :field="fields.phone_custodian" class="is-4" />
            </edit-section>

            <edit-section header="Description">

                <input-base :document="document" :base="locale" :field="fields.summary" class="is-12"/>
                <input-base :document="document" :base="locale" :field="fields.description" class="is-12"/>
                <input-base :document="document" :base="locale" :field="fields.access" class="is-12"/>
                <input-base :document="document" :base="locale" :field="fields.access_period" class="is-12"/>

            </edit-section>
        </div>
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
