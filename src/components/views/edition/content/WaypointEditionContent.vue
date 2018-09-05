<template>
    <div>

        <edit-section header="Title">
            <input-base class="is-9" :document="document" :base="locale" :field="fields.title"/>
            <input-base class="is-3" :document="document" :field="fields.waypoint_type" />
        </edit-section>

        <edit-section header="Geolocation">
            <input-base class="is-4" :document="document" :field="fields.elevation" />
            <input-base class="is-4" :document="document" :field="fields.elevation_min" />
            <input-base class="is-4" :document="document" :field="fields.prominence" />
            <input-base class="is-4" :document="document" :field="fields.maps_info" />
        </edit-section>

        <edit-section header="Transport &amp; road or PT access">
            <input-base class="is-4" :document="document" :field="fields.snow_clearance_rating" />
            <input-base class="is-4" :document="document" :field="fields.lift_access" />
            <input-base class="is-4" :document="document" :field="fields.public_transportation_rating" />
            <input-base class="is-4" :document="document" :field="fields.parking_fee" />
        </edit-section>

        <edit-section header="Types and styles">
            <input-checkboxes class="is-6" :document="document" :field="fields.rock_types" />
            <input-checkboxes class="is-6" :document="document" :field="fields.climbing_styles" />
            <input-checkboxes class="is-4" :document="document" :field="fields.climbing_outdoor_types" />
            <input-checkboxes class="is-6" :document="document" :field="fields.climbing_indoor_types" />
            <input-checkboxes class="is-4" :document="document" :field="fields.best_periods" />
            <input-base class="is-4" :document="document" :field="fields.access_time" />
            <input-base class="is-4" :document="document" :field="fields.rain_proof" />
            <input-base class="is-4" :document="document" :field="fields.children_proof" />
            <input-base class="is-4" :document="document" :field="fields.orientations" />
            <input-base class="is-4" :document="document" :field="fields.ground_types" />

            <input-base class="is-4" :document="document" :field="fields.product_types" />

            <input-base class="is-4" :document="document" :field="fields.slackline_types" />

            <!-- todo : retrouver ou il est celui la -->
            <input-base class="is-4" :document="document" :field="fields.public_transportation_types" />

        </edit-section>

        <edit-section header="Numbers">
            <input-base class="is-4" :document="document" :field="fields.length" />
            <input-base class="is-4" :document="document" :field="fields.slope" />
            <input-base class="is-4" :document="document" :field="fields.capacity" />
            <input-base class="is-4" :document="document" :field="fields.custodianship" />
            <input-base class="is-4" :document="document" :field="fields.capacity_staffed" />
            <input-base class="is-3" :document="document" :field="fields.height_max" />
            <input-base class="is-3" :document="document" :field="fields.height_min" />
            <input-base class="is-3" :document="document" :field="fields.height_median" />
            <input-base class="is-3" :document="document" :field="fields.routes_quantity" />

            <input-base class="is-4" :document="document" :field="fields.slackline_length_max" />
            <input-base class="is-4" :document="document" :field="fields.slackline_length_min" />

        </edit-section>

        <edit-section header="Ratings">
            <input-checkboxes class="is-4" :document="document" :field="fields.equipment_ratings" />
            <input-base class="is-4" :document="document" :field="fields.climbing_rating_min" />
            <input-base class="is-4" :document="document" :field="fields.climbing_rating_max" />
            <input-base class="is-4" :document="document" :field="fields.climbing_rating_median" />

            <input-base class="is-6" :document="document" :field="fields.paragliding_rating" />
            <input-base class="is-6" :document="document" :field="fields.exposition_rating" />
        </edit-section>

        <edit-section header="Equipement">
            <!-- todo radio -->
            <input-base class="is-3" :document="document" :field="fields.matress_unstaffed" />
            <input-base class="is-3" :document="document" :field="fields.blanket_unstaffed" />
            <input-base class="is-3" :document="document" :field="fields.gas_unstaffed" />
            <input-base class="is-3" :document="document" :field="fields.heating_unstaffed" />
        </edit-section>

        <edit-section header="Contact">
            <input-base class="is-8" :document="document" :field="fields.url" />
            <input-base class="is-4" :document="document" :field="fields.phone" />
            <input-base class="is-4" :document="document" :field="fields.phone_custodian" />
        </edit-section>

        <edit-section header="Description">

            <input-base class="is-12" :document="document" :base="locale" :field="fields.summary"/>
            <input-base class="is-12" :document="document" :base="locale" :field="fields.description"/>
            <input-base class="is-12" :document="document" :base="locale" :field="fields.access"/>
            <input-base class="is-12" :document="document" :base="locale" :field="fields.access_period"/>

        </edit-section>
    </div>
</template>

<script>

    import TabView from './utils/TabView'
    import TabItem from './utils/TabItem'

    import InputBase from './utils/InputBase'
    import InputCheckboxes from './utils/InputCheckboxes'
    import EditSection from './utils/EditSection'

    export default {
        components:{
            TabView,
            TabItem,
            EditSection,
            InputBase,
            InputCheckboxes,
        },

        props : ["document", "locale", "fields"],
    }
</script>
