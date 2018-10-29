<template>
    <edition-container>
        <template slot-scope="{ document, fields }">

            <tab-view>

                <tab-item :title="$gettext('general informations')">
                    <form-row :label="$gettext('waypoint')" is-grouped>
                        <form-input :document="document" :field="fields.waypoint_type" :prefix="$gettext('type')"/>
                        <form-input :document="document" :field="fields.title" :prefix="$gettext('title')" is-expanded/>
                    </form-row>

                    <form-row :label="$gettext('Terrain')" is-grouped>
                        <form-input :document="document" :field="fields.elevation" :prefix="$gettext('elevation')"/>
                        <form-input :document="document" :field="fields.prominence" :prefix="$gettext('prominence')"/>
                    </form-row>

                    <form-input-row :document="document" :field="fields.elevation_min" />

                    <map-input-row :document="document" />
                    
                    <form-input-row :document="document" :field="fields.maps_info" />

                </tab-item>

                <tab-item :title="$gettext('Transport &amp; road or PT access')">
                    <form-input-row :document="document" :field="fields.snow_clearance_rating" />
                    <form-input-row :document="document" :field="fields.lift_access" />
                    <form-input-row :document="document" :field="fields.public_transportation_rating" />
                    <form-input-row :document="document" :field="fields.parking_fee" />
                    <form-input-row :document="document" :field="fields.public_transportation_types" />
                </tab-item>

                <tab-item :title="$gettext('Types and styles')">
                    <form-input-row :document="document" :field="fields.climbing_outdoor_types" />
                    <form-input-row :document="document" :field="fields.climbing_indoor_types" />
                    <form-input-row :document="document" :field="fields.climbing_styles" />
                    <form-input-row :document="document" :field="fields.rock_types" />
                    <form-input-row :document="document" :field="fields.orientations" />
                    <form-input-row :document="document" :field="fields.best_periods" />
                    <form-input-row :document="document" :field="fields.access_time" />
                    <form-input-row :document="document" :field="fields.rain_proof" />
                    <form-input-row :document="document" :field="fields.children_proof" />
                    <form-input-row :document="document" :field="fields.ground_types" />
                    <form-input-row :document="document" :field="fields.product_types" />
                    <form-input-row :document="document" :field="fields.slackline_types" />


                </tab-item>

                <tab-item :title="$gettext('Numbers')">
                    <form-input-row :document="document" :field="fields.length" />
                    <form-input-row :document="document" :field="fields.slope" />
                    <form-input-row :document="document" :field="fields.custodianship" />
                    <form-input-row :document="document" :field="fields.capacity_staffed" />
                    <form-input-row :document="document" :field="fields.capacity" />
                    <form-input-row :document="document" :field="fields.matress_unstaffed" />
                    <form-input-row :document="document" :field="fields.blanket_unstaffed" />
                    <form-input-row :document="document" :field="fields.gas_unstaffed" />
                    <form-input-row :document="document" :field="fields.heating_unstaffed" />

                    <form-row :label="$gettext('height')" is-grouped>
                        <form-input :document="document" :field="fields.height_min" prefix="min"/>
                        <form-input :document="document" :field="fields.height_median" prefix="median"/>
                        <form-input :document="document" :field="fields.height_max" prefix="max"/>
                    </form-row>

                    <form-input-row :document="document" :field="fields.routes_quantity" />

                    <form-input-row :document="document" :field="fields.slackline_length_max" />
                    <form-input-row :document="document" :field="fields.slackline_length_min" />

                </tab-item>

                <tab-item :title="$gettext('ratings')">
                    <form-input-row :document="document" :field="fields.equipment_ratings" />

                    <form-row :label="$gettext('ratings')" is-grouped>
                        <form-input :document="document" :field="fields.climbing_rating_min" prefix="min"/>
                        <form-input :document="document" :field="fields.climbing_rating_median" prefix="median"/>
                        <form-input :document="document" :field="fields.climbing_rating_max" prefix="max"/>
                    </form-row>

                    <form-input-row :document="document" :field="fields.paragliding_rating" />
                    <form-input-row :document="document" :field="fields.exposition_rating" />
                </tab-item>

                <tab-item :title="$gettext('Contact')">
                    <form-input-row :document="document" :field="fields.url" />
                    <form-input-row :document="document" :field="fields.phone" />
                    <form-input-row :document="document" :field="fields.phone_custodian" />
                </tab-item>

                <tab-item :title="$gettext('Description')">

                    <form-input-row :document="document" :field="fields.summary"/>
                    <form-input-row :document="document" :field="fields.description"/>
                    <form-input-row :document="document" :field="fields.access"/>
                    <form-input-row :document="document" :field="fields.access_period"/>

                </tab-item>
            </tab-view>
        </template>
    </edition-container>
</template>


<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin'

    export default {
        mixins: [ DocumentEditionViewMixin ],
    }

</script>
