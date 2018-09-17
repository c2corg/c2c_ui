<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">
        <div>

            <edit-section header="Comments">
                <input-base :document="document" :base="locale" :field="fields.title" class="is-12"/>
                <input-base :document="document" :field="fields.activities" class="is-12" />
            </edit-section>

            <edit-section header="Geolocation">
                <input-base :document="document" :field="fields.elevation" />
            </edit-section>

            <edit-section header="General informations">
                <input-base :document="document" :field="fields.date" class="is-3" />
                <input-checkboxes :document="document" :field="fields.event_type" class="is-3" />
                <input-base :document="document" :field="fields.nb_participants" class="is-3" />
                <input-base :document="document" :field="fields.nb_impacted" class="is-3" />
                <input-base :document="document" :field="fields.severity" class="is-3" />
                <input-base :document="document" :field="fields.rescue" class="is-3" />
                <input-base :document="document" :field="fields.avalanche_level" class="is-3" />
                <input-base :document="document" :field="fields.avalanche_slope" class="is-3" />
            </edit-section>

            <edit-section header="General informations">
                <input-base :document="document" :field="fields.age" class="is-3" />
                <input-base :document="document" :field="fields.gender" class="is-3" />
                <input-base :document="document" :field="fields.author_status" class="is-3" />
                <input-base :document="document" :field="fields.autonomy" class="is-3" />
                <input-base :document="document" :field="fields.activity_rate" class="is-3" />
                <input-base :document="document" :field="fields.nb_outings" class="is-3" />
                <input-base :document="document" :field="fields.previous_injuries" class="is-3" />
            </edit-section>

            <edit-section header="Description">
                <input-base :document="document" :base="locale" :field="fields.summary" class="is-12"/>
                <input-base :document="document" :base="locale" :field="fields.description" class="is-12"/>
                <input-base :document="document" :field="fields.anonymous" />
            </edit-section>

            <edit-section header="Factors">
                <input-base :document="document" :base="locale" :field="fields.place" class="is-12" />
                <input-base :document="document" :base="locale" :field="fields.route_study" class="is-12" />
                <input-base :document="document" :base="locale" :field="fields.conditions" class="is-12" />
                <input-base :document="document" :base="locale" :field="fields.training" class="is-12" />
                <input-base :document="document" :base="locale" :field="fields.motivations" class="is-12" />
                <input-base :document="document" :base="locale" :field="fields.group_management" class="is-12" />
                <input-base :document="document" :base="locale" :field="fields.risk" class="is-12" />
                <input-base :document="document" :base="locale" :field="fields.time_management" class="is-12" />
                <input-base :document="document" :base="locale" :field="fields.safety" class="is-12" />
                <input-base :document="document" :base="locale" :field="fields.reduce_impact" class="is-12" />
                <input-base :document="document" :base="locale" :field="fields.increase_impact" class="is-12" />
                <input-base :document="document" :base="locale" :field="fields.modifications" class="is-12" />
                <input-base :document="document" :base="locale" :field="fields.other_comments" class="is-12" />
                <input-base :document="document" :field="fields.disable_comments" />
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
