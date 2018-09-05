<template>
    <div>

        <edit-section header="Comments">
            <input-base class="is-12" :document="document" :base="locale" :field="fields.title"/>
            <input-base class="is-12" :document="document" :field="fields.activities" />
        </edit-section>

        <edit-section header="Geolocation">
            <input-base :document="document" :field="fields.elevation" />
        </edit-section>

        <edit-section header="General informations">
            <input-base class="is-3" :document="document" :field="fields.date" />
            <input-checkboxes class="is-3" :document="document" :field="fields.event_type" />
            <input-base class="is-3" :document="document" :field="fields.nb_participants" />
            <input-base class="is-3" :document="document" :field="fields.nb_impacted" />
            <input-base class="is-3" :document="document" :field="fields.severity" />
            <input-base class="is-3" :document="document" :field="fields.rescue" />
            <input-base class="is-3" :document="document" :field="fields.avalanche_level" />
            <input-base class="is-3" :document="document" :field="fields.avalanche_slope" />
        </edit-section>

        <edit-section header="General informations">
            <input-base class="is-3" :document="document" :field="fields.age" />
            <input-base class="is-3" :document="document" :field="fields.gender" />
            <input-base class="is-3" :document="document" :field="fields.author_status" />
            <input-base class="is-3" :document="document" :field="fields.autonomy" />
            <input-base class="is-3" :document="document" :field="fields.activity_rate" />
            <input-base class="is-3" :document="document" :field="fields.nb_outings" />
            <input-base class="is-3" :document="document" :field="fields.previous_injuries" />
        </edit-section>

        <edit-section header="Description">
            <input-base class="is-12" :document="document" :base="locale" :field="fields.summary"/>
            <input-base class="is-12" :document="document" :base="locale" :field="fields.description"/>
            <input-base :document="document" :field="fields.anonymous" />
        </edit-section>

        <edit-section header="Factors">
            <input-base class="is-12" :document="document" :base="locale" :field="fields.place" />
            <input-base class="is-12" :document="document" :base="locale" :field="fields.route_study" />
            <input-base class="is-12" :document="document" :base="locale" :field="fields.conditions" />
            <input-base class="is-12" :document="document" :base="locale" :field="fields.training" />
            <input-base class="is-12" :document="document" :base="locale" :field="fields.motivations" />
            <input-base class="is-12" :document="document" :base="locale" :field="fields.group_management" />
            <input-base class="is-12" :document="document" :base="locale" :field="fields.risk" />
            <input-base class="is-12" :document="document" :base="locale" :field="fields.time_management" />
            <input-base class="is-12" :document="document" :base="locale" :field="fields.safety" />
            <input-base class="is-12" :document="document" :base="locale" :field="fields.reduce_impact" />
            <input-base class="is-12" :document="document" :base="locale" :field="fields.increase_impact" />
            <input-base class="is-12" :document="document" :base="locale" :field="fields.modifications" />
            <input-base class="is-12" :document="document" :base="locale" :field="fields.other_comments" />
            <input-base :document="document" :field="fields.disable_comments" />
        </edit-section>
    </div>
</template>

<script>

    import EditSection from './utils/EditSection'

    import InputBase from './utils/InputBase'
    import InputActivities from './utils/InputActivities'
    import InputCheckboxes from './utils/InputCheckboxes'

    export default {
        components:{
            EditSection,
            InputBase,
            InputActivities,
            InputCheckboxes,
        },

        props : ["document", "locale", "fields"],
    }
</script>
