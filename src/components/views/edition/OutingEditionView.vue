<template>
    <edition-container>
        <template slot-scope="{ document, fields }">

            <tab-view>
                <tab-item :title="$gettext('general informations')">
                    <form-input-row :document="document" :field="fields.title" is-expanded/>

                    <form-row :label="$gettext('Dates')" is-grouped>
                        <form-input :document="document" :field="fields.date_start" prefix="start"/>
                        <form-input :document="document" :field="fields.date_end" prefix="end"/>
                    </form-row>

                    <form-input-row :document="document" :field="fields.activities" />

                    <form-input-row :document="document" :field="fields.description" />

                    <form-row :label="$gettext('participants')" is-grouped>
                        <form-input :document="document" :field="fields.participant_count" :prefix="$gettext('count')"/>
                        <form-input :document="document" :field="fields.participants" :prefix="$gettext('Without c2c account')" is-expanded/>
                    </form-row>
                </tab-item>

                <tab-item :title="$gettext('detailled informations')">
                    <form-input-row :document="document" :field="fields.partial_trip" />
                    <form-input-row :document="document" :field="fields.length_total" />

                    <form-row :label="$gettext('Elevation')" is-grouped>
                        <form-input :document="document" :field="fields.elevation_min" prefix="min"/>
                        <form-input :document="document" :field="fields.elevation_max" prefix="max"/>
                    </form-row>

                    <form-row :label="$gettext('height_diff')" is-grouped>
                        <form-input :document="document" :field="fields.height_diff_up" prefix="up"/>
                        <form-input :document="document" :field="fields.height_diff_down" prefix="down"/>
                    </form-row>

                    <form-input-row :document="document" :field="fields.height_diff_difficulties" />

                    <form-input-row :document="document" :field="fields.global_rating" />

                    <form-input-row :document="document" :field="fields.rock_free_rating" />
                    <form-input-row :document="document" :field="fields.engagement_rating" />
                    <form-input-row :document="document" :field="fields.equipment_rating" />

                    <form-input-row :document="document" :field="fields.ski_rating" />
                    <form-input-row :document="document" :field="fields.labande_global_rating" />
                    <form-input-row :document="document" :field="fields.snowshoe_rating" />

                    <form-input-row :document="document" :field="fields.ice_rating" />
                    <form-input-row :document="document" :field="fields.via_ferrata_rating" />
                    <form-input-row :document="document" :field="fields.hiking_rating" />

                    <form-row :label="$gettext('MTB rating')" is-grouped>
                        <form-input :document="document" :field="fields.mtb_down_rating" prefix="down"/>
                        <form-input :document="document" :field="fields.mtb_up_rating" prefix="up"/>
                    </form-row>
                </tab-item>

                <tab-item :title="$gettext('weather and conditions')">

                    <form-row :label="$gettext('condition_rating')" is-grouped>
                        <form-input :document="document" :field="fields.condition_rating" />
                        <form-input :document="document" :field="fields.glacier_rating" :prefix="$gettext('glacier')"/>
                    </form-row>

                    <form-input-row :document="document" :field="fields.elevation_up_snow" />
                    <form-input-row :document="document" :field="fields.elevation_down_snow" />

                    <form-row :label="$gettext('Snow')" is-grouped>
                        <form-input :document="document" :field="fields.snow_quantity" prefix="quantity"/>
                        <form-input :document="document" :field="fields.snow_quality" prefix="quality"/>
                    </form-row>

                    <form-input-row :document="document" :field="fields.conditions" />

                    <form-input-row :document="document" :field="fields.avalanches" />
                    <form-input-row :document="document" :field="fields.avalanche_signs" />

                    <form-input-row :document="document" :field="fields.weather" />
                </tab-item>

                <tab-item :title="$gettext('access')">
                    <form-input-row :document="document" :field="fields.public_transport" />
                    <form-input-row :document="document" :field="fields.frequentation" />
                    <form-input-row :document="document" :field="fields.hut_comment" />
                    <form-input-row :document="document" :field="fields.hut_status" />
                    <form-input-row :document="document" :field="fields.elevation_access" />
                    <form-input-row :document="document" :field="fields.access_condition" />
                    <form-input-row :document="document" :field="fields.access_comment" />
                    <form-input-row :document="document" :field="fields.lift_status" />
                </tab-item>

                <tab-item :title="$gettext('comments')">
                    <form-input-row :document="document" :field="fields.route_description" />
                    <form-input-row :document="document" :field="fields.timing" />
                    <form-input-row :document="document" :field="fields.disable_comments" />
                </tab-item>

            </tab-view>

            <!-- TODO where is that ??
                <form-input-row :document="document" :field="fields.summary"/>
            -->
        </template>
    </edition-container>
</template>


<script>

    import FormComponentsMixin from './utils/FormComponentsMixin'

    export default {
        mixins: [ FormComponentsMixin ],
    }

</script>
