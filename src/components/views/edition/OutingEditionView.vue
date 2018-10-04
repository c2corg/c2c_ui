<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">

        <edit-section header="general informations">
            <input-base :document="document" :field="fields.date_start" class="is-6" />
            <input-base :document="document" :field="fields.date_end" class="is-6" />
            <!-- TODO : one day trip -->

            <input-activities :document="document" class="is-12"/>
            <input-base :document="document" :base="locale" :field="fields.route_description" class="is-12"/>
            <input-base :document="document" :base="locale" :field="fields.timing" class="is-12"/>

            <input-base :document="document" :field="fields.partial_trip" class="is-4" />
            <input-base :document="document" :field="fields.length_total" class="is-4" />
            <input-base :document="document" :field="fields.elevation_min" class="is-4" />
            <input-base :document="document" :field="fields.elevation_max" class="is-4" />
            <input-base :document="document" :field="fields.height_diff_up" class="is-4" />
            <input-base :document="document" :field="fields.height_diff_down" class="is-4" />
            <input-base :document="document" :field="fields.ski_rating" class="is-4" />
            <input-base :document="document" :field="fields.labande_global_rating" class="is-4" />
            <input-base :document="document" :field="fields.snowshoe_rating" class="is-4" />
            <input-base :document="document" :field="fields.global_rating" class="is-4" />
            <input-base :document="document" :field="fields.engagement_rating" class="is-4" />
            <input-base :document="document" :field="fields.equipment_rating" class="is-4" />
            <input-base :document="document" :field="fields.ice_rating" class="is-4" />
            <input-base :document="document" :field="fields.via_ferrata_rating" class="is-4" />
            <input-base :document="document" :field="fields.hiking_rating" class="is-4" />
            <input-base :document="document" :field="fields.mtb_down_rating" class="is-4" />
            <input-base :document="document" :field="fields.mtb_up_rating" class="is-4" />
            <input-base :document="document" :field="fields.rock_free_rating" class="is-4" />
            <input-base :document="document" :field="fields.height_diff_difficulties" class="is-4" />
        </edit-section>

        <edit-section header="weather and conditions">

            <input-base :document="document" :base="locale" :field="fields.weather" class="is-6"/>
            <input-base :document="document" :base="locale" :field="fields.conditions" class="is-6"/>
            <!-- TODO
            <input-base :document="document" :base="locale" :field="fields.conditions_levels"/>
            -->

            <input-base :document="document" :field="fields.condition_rating" class="is-4" />
            <input-base :document="document" :field="fields.elevation_up_snow" class="is-4" />
            <input-base :document="document" :field="fields.elevation_down_snow" class="is-4" />
            <input-base :document="document" :field="fields.snow_quantity" class="is-4" />
            <input-base :document="document" :field="fields.snow_quality" class="is-4" />
            <input-base :document="document" :field="fields.glacier_rating" class="is-4" />
            <input-checkboxes :document="document" :field="fields.avalanche_signs" class="is-12" />
            <input-base :document="document" :base="locale" :field="fields.avalanches" class="is-12"/>
        </edit-section>

        <edit-section header="road or PT access &amp; hut">
            <input-base :document="document" :field="fields.public_transport" class="is-4" />
            <input-base :document="document" :field="fields.frequentation" class="is-4" />
            <input-base :document="document" :field="fields.lift_status" class="is-4" />
            <input-base :document="document" :base="locale" :field="fields.hut_comment" class="is-12"/>
            <input-base :document="document" :field="fields.hut_status" class="is-4" />
            <input-base :document="document" :field="fields.elevation_access" class="is-4" />
            <input-base :document="document" :field="fields.access_condition" class="is-4" />
            <input-base :document="document" :base="locale" :field="fields.access_comment" class="is-12"/>
        </edit-section>

        <edit-section header="comments">
            <input-base :document="document" :base="locale" :field="fields.title" class="is-12"/>
            <input-base :document="document" :base="locale" :field="fields.participants" class="is-8"/>
            <input-base :document="document" :field="fields.participant_count" class="is-4" />
            <input-base :document="document" :base="locale" :field="fields.description" class="is-12"/>
            <input-base :document="document" :field="fields.disable_comments" class="is-4" />
        </edit-section>

        <!-- TODO where is that ??
            <input-base :document="document" :base="locale" :field="fields.summary"/>
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
