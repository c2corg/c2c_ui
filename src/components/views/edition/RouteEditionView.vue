<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">
        <tab-view>
            <tab-item :title="$gettext('general informations')">
                <field-simple :document="document" :base="locale" :field="fields.title"/>
                <field-simple :document="document" :field="fields.main_waypoint_id"/>
                <field-simple :document="document" :field="fields.activities"/>
                <field-simple :document="document" :field="fields.climbing_outdoor_type"/>
            </tab-item>

            <tab-item :title="$gettext('slacklining')">
                <field-simple :document="document" :field="fields.slackline_type"/>
                <field-simple :document="document" :field="fields.route_length"/>
                <field-simple :document="document" :field="fields.slackline_height"/>
            </tab-item>

            <tab-item :title="$gettext('configuration')">
                <field-simple :document="document" :field="fields.orientations"/>
                <field-simple :document="document" :field="fields.route_types"/>
                <field-simple :document="document" :field="fields.configuration"/>
                <field-simple :document="document" :field="fields.rock_types"/>
            </tab-item>

            <tab-item :title="$gettext('numbers')">
                <field-row :label="$gettext('elevation')">
                    <field-input :document="document" :field="fields.elevation_min" :prefix="$gettext('min')"/>
                    <field-input :document="document" :field="fields.elevation_max" :prefix="$gettext('max')"/>
                </field-row>

                <field-row :label="$gettext('height_diff')">
                    <field-input :document="document" :field="fields.height_diff_up" :prefix="$gettext('up')"/>
                    <field-input :document="document" :field="fields.height_diff_down" :prefix="$gettext('down')"/>
                </field-row>

                <field-simple :document="document" :field="fields.height_diff_access"/>
                <field-simple :document="document" :field="fields.height_diff_difficulties"/>
                <field-simple :document="document" :field="fields.difficulties_height"/>
                <field-simple :document="document" :field="fields.route_length"/>
                <field-simple :document="document" :field="fields.mtb_length_asphalt"/>
                <field-simple :document="document" :field="fields.mtb_length_trail"/>
                <field-simple :document="document" :field="fields.mtb_height_diff_portages"/>
                <field-simple :document="document" :field="fields.durations"/>
                <field-simple :document="document" :field="fields.lift_access"/>
            </tab-item>

            <tab-item :title="$gettext('ratings')">
                <field-simple :document="document" :field="fields.labande_ski_rating"/>
                <field-simple :document="document" :field="fields.ski_rating"/>
                <field-simple :document="document" :field="fields.labande_global_rating"/>
                <field-simple :document="document" :field="fields.snowshoe_rating"/>
                <field-simple :document="document" :field="fields.global_rating"/>
                <field-simple :document="document" :field="fields.engagement_rating"/>
                <field-simple :document="document" :field="fields.equipment_rating"/>
                <field-simple :document="document" :field="fields.ice_rating"/>
                <field-simple :document="document" :field="fields.mixed_rating"/>
                <field-simple :document="document" :field="fields.risk_rating"/>
                <field-simple :document="document" :field="fields.via_ferrata_rating"/>
                <field-simple :document="document" :field="fields.hiking_rating"/>
                <field-simple :document="document" :field="fields.mtb_down_rating"/>
                <field-simple :document="document" :field="fields.mtb_up_rating"/>
                <field-simple :document="document" :field="fields.rock_free_rating"/>
                <field-simple :document="document" :field="fields.exposition_rock_rating"/>
                <field-simple :document="document" :field="fields.rock_required_rating"/>
                <field-simple :document="document" :field="fields.aid_rating"/>
                <field-simple :document="document" :field="fields.ski_exposition"/>
                <field-simple :document="document" :field="fields.hiking_mtb_exposition"/>
                <!-- TODO slope -->
            </tab-item>

            <tab-item :title="$gettext('Comments')">
                <field-simple :document="document" :base="locale" :field="fields.summary"/>
                <field-simple :document="document" :base="locale" :field="fields.route_history"/>
                <field-simple :document="document" :base="locale" :field="fields.description"/>
                <field-simple :document="document" :base="locale" :field="fields.slackline_anchor1"/>
                <field-simple :document="document" :base="locale" :field="fields.slackline_anchor2"/>
                <field-simple :document="document" :base="locale" :field="fields.remarks"/>
                <field-simple :document="document" :base="locale" :field="fields.gear"/>
                <field-simple :document="document" :field="fields.glacier_gear" class="is-narrow"/>
                <field-simple :document="document" :base="locale" :field="fields.external_resources"/>
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
