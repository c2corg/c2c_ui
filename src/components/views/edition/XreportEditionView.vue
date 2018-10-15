<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">
        <tab-view>

            <tab-item :title="$gettext('Comments')">
                <field-simple :document="document" :base="locale" :field="fields.title"/>
                <field-simple :document="document" :field="fields.activities" />
            </tab-item>

            <tab-item :title="$gettext('Geolocation')">
                <field-simple :document="document" :field="fields.elevation" />
            </tab-item>

            <tab-item :title="$gettext('General informations')">
                <field-simple :document="document" :field="fields.date" />
                <field-simple :document="document" :field="fields.event_type" />
                <field-simple :document="document" :field="fields.nb_participants" />
                <field-simple :document="document" :field="fields.nb_impacted" />
                <field-simple :document="document" :field="fields.severity" />
                <field-simple :document="document" :field="fields.rescue" />
                <field-simple :document="document" :field="fields.avalanche_level" />
                <field-simple :document="document" :field="fields.avalanche_slope" />
            </tab-item>

            <tab-item :title="$gettext('General informations')">
                <field-simple :document="document" :field="fields.age" />
                <field-simple :document="document" :field="fields.gender" />
                <field-simple :document="document" :field="fields.author_status" />
                <field-simple :document="document" :field="fields.autonomy" />
                <field-simple :document="document" :field="fields.activity_rate" />
                <field-simple :document="document" :field="fields.nb_outings" />
                <field-simple :document="document" :field="fields.previous_injuries" />
            </tab-item>

            <tab-item :title="$gettext('Description')">
                <field-simple :document="document" :base="locale" :field="fields.summary"/>
                <field-simple :document="document" :base="locale" :field="fields.description"/>
                <field-simple :document="document" :field="fields.anonymous" />
            </tab-item>

            <tab-item :title="$gettext('Factors')">
                <field-simple :document="document" :base="locale" :field="fields.place" />
                <field-simple :document="document" :base="locale" :field="fields.route_study" />
                <field-simple :document="document" :base="locale" :field="fields.conditions" />
                <field-simple :document="document" :base="locale" :field="fields.training" />
                <field-simple :document="document" :base="locale" :field="fields.motivations" />
                <field-simple :document="document" :base="locale" :field="fields.group_management" />
                <field-simple :document="document" :base="locale" :field="fields.risk" />
                <field-simple :document="document" :base="locale" :field="fields.time_management" />
                <field-simple :document="document" :base="locale" :field="fields.safety" />
                <field-simple :document="document" :base="locale" :field="fields.reduce_impact" />
                <field-simple :document="document" :base="locale" :field="fields.increase_impact" />
                <field-simple :document="document" :base="locale" :field="fields.modifications" />
                <field-simple :document="document" :base="locale" :field="fields.other_comments" />
                <field-simple :document="document" :field="fields.disable_comments" />
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
