<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">

        <tab-view>
            <tab-item :title="$gettext('general informations')">
                <field-simple :document="document" :base="locale" :field="fields.title" />

                <field-row :label="$gettext('Dates')">
                    <field-input :document="document" :field="fields.date_start" prefix="start"/>
                    <field-input :document="document" :field="fields.date_end" prefix="end"/>
                </field-row>

                <field-simple :document="document" :field="fields.activities" />

                <field-simple :document="document" :base="locale" :field="fields.route_description" />

                <field-simple :document="document" :field="fields.partial_trip" />
                <field-simple :document="document" :field="fields.length_total" />

                <field-row :label="$gettext('Elevation')">
                    <field-input :document="document" :field="fields.elevation_min" prefix="min"/>
                    <field-input :document="document" :field="fields.elevation_max" prefix="max"/>
                </field-row>

                <field-row :label="$gettext('height_diff')">
                    <field-input :document="document" :field="fields.height_diff_up" prefix="up"/>
                    <field-input :document="document" :field="fields.height_diff_down" prefix="down"/>
                </field-row>

                <field-simple :document="document" :field="fields.height_diff_difficulties" />

                <field-simple :document="document" :field="fields.global_rating" />

                <field-simple :document="document" :field="fields.rock_free_rating" />
                <field-simple :document="document" :field="fields.engagement_rating" />
                <field-simple :document="document" :field="fields.equipment_rating" />

                <field-simple :document="document" :field="fields.ski_rating" />
                <field-simple :document="document" :field="fields.labande_global_rating" />
                <field-simple :document="document" :field="fields.snowshoe_rating" />

                <field-simple :document="document" :field="fields.ice_rating" />
                <field-simple :document="document" :field="fields.via_ferrata_rating" />
                <field-simple :document="document" :field="fields.hiking_rating" />

                <field-row :label="$gettext('MTB rating')">
                    <field-input :document="document" :field="fields.mtb_down_rating" prefix="down"/>
                    <field-input :document="document" :field="fields.mtb_up_rating" prefix="up"/>
                </field-row>


            </tab-item>

            <tab-item :title="$gettext('weather and conditions')">
                <field-simple :document="document" :base="locale" :field="fields.weather" />
                <field-simple :document="document" :base="locale" :field="fields.conditions" />

                <field-simple :document="document" :field="fields.condition_rating" />

                <field-simple :document="document" :field="fields.elevation_up_snow" />
                <field-simple :document="document" :field="fields.elevation_down_snow" />

                <field-row :label="$gettext('Snow')">
                    <field-input :document="document" :field="fields.snow_quantity" prefix="quantity"/>
                    <field-input :document="document" :field="fields.snow_quality" prefix="quality"/>
                </field-row>

                <field-simple :document="document" :field="fields.glacier_rating" />
                <field-simple :document="document" :field="fields.avalanche_signs" />
                <field-simple :document="document" :base="locale" :field="fields.avalanches" />
            </tab-item>

            <tab-item :title="$gettext('access')">
                <field-simple :document="document" :field="fields.public_transport" />
                <field-simple :document="document" :field="fields.frequentation" />
                <field-simple :document="document" :field="fields.lift_status" />
                <field-simple :document="document" :base="locale" :field="fields.hut_comment" />
                <field-simple :document="document" :field="fields.hut_status" />
                <field-simple :document="document" :field="fields.elevation_access" />
                <field-simple :document="document" :field="fields.access_condition" />
                <field-simple :document="document" :base="locale" :field="fields.access_comment" />
            </tab-item>

            <tab-item :title="$gettext('comments')">
                <field-simple :document="document" :base="locale" :field="fields.participants" />
                <field-simple :document="document" :field="fields.participant_count" />
                <field-simple :document="document" :base="locale" :field="fields.description" />
                <field-simple :document="document" :base="locale" :field="fields.timing" />
                <field-simple :document="document" :field="fields.disable_comments" />
            </tab-item>

        </tab-view>

        <!-- TODO where is that ??
            <field-simple :document="document" :base="locale" :field="fields.summary"/>
        -->

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
