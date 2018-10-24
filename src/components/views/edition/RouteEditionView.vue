<template>
    <edition-container>
        <template slot-scope="{ document, fields }">

            <tab-view>
                <tab-item :title="$gettext('general informations')">
                    <form-input-row :document="document" :field="fields.title" is-expanded/>
                    <form-input-row :document="document" :field="fields.main_waypoint_id"/>
                    <form-input-row :document="document" :field="fields.activities" helper="activities"/>
                    <form-input-row :document="document" :field="fields.climbing_outdoor_type"/>

                    <form-row label="" always-visible>
                        <map-view :documents="[document]" editable/>
                    </form-row>

                </tab-item>

                <tab-item :title="$gettext('slacklining')">
                    <form-input-row :document="document" :field="fields.slackline_type"/>
                    <form-input-row :document="document" :field="fields.route_length"/>
                    <form-input-row :document="document" :field="fields.slackline_height"/>
                </tab-item>

                <tab-item :title="$gettext('configuration')">
                    <form-input-row :document="document" :field="fields.orientations" helper="orientations"/>
                    <form-input-row :document="document" :field="fields.route_types" helper="route_types"/>
                    <form-input-row :document="document" :field="fields.configuration" helper="route_configuration_types"/>
                    <form-input-row :document="document" :field="fields.rock_types"/>
                </tab-item>

                <tab-item :title="$gettext('numbers')">
                    <form-row :label="$gettext('elevation')" is-grouped helper="elevation_min_max">
                        <form-input :document="document" :field="fields.elevation_min" :prefix="$gettext('min')" />
                        <form-input :document="document" :field="fields.elevation_max" :prefix="$gettext('max')" />
                    </form-row>

                    <form-row :label="$gettext('height_diff')" is-grouped>
                        <form-input :document="document" :field="fields.height_diff_up" :prefix="$gettext('up')" helper="height_diff_up"/>
                        <form-input :document="document" :field="fields.height_diff_down" :prefix="$gettext('down')" helper="height_diff_down"/>
                    </form-row>

                    <form-input-row :document="document" :field="fields.height_diff_access" helper="height_diff_access"/>
                    <form-input-row :document="document" :field="fields.height_diff_difficulties" helper="height_diff_difficulties"/>
                    <form-input-row :document="document" :field="fields.difficulties_height" helper="difficulties_height"/>
                    <form-input-row :document="document" :field="fields.route_length"/>
                    <form-input-row :document="document" :field="fields.mtb_length_asphalt"/>
                    <form-input-row :document="document" :field="fields.mtb_length_trail"/>
                    <form-input-row :document="document" :field="fields.mtb_height_diff_portages"/>
                    <form-input-row :document="document" :field="fields.durations"/>
                    <form-input-row :document="document" :field="fields.lift_access"/>
                </tab-item>

                <tab-item :title="$gettext('ratings')">

                    <form-input-row :document="document" :field="fields.global_rating" helper="global_rating"/>

                    <form-row :label="$gettext('Climbing ratings')" is-grouped>
                        <form-input :document="document" :field="fields.rock_free_rating" :prefix="$gettext('free')" helper="rock_free_rating"/>
                        <form-input :document="document" :field="fields.rock_required_rating" :prefix="$gettext('required')" helper="rock_required_rating"/>
                        <form-input :document="document" :field="fields.aid_rating" :prefix="$gettext('aid')" helper="aid_rating"/>
                    </form-row>

                    <form-input-row :document="document" :field="fields.labande_global_rating" helper="labande_global_rating"/>
                    <form-input-row :document="document" :field="fields.labande_ski_rating" helper="labande_ski_rating"/>
                    <form-input-row :document="document" :field="fields.ski_rating" helper="ski_rating"/>

                    <form-row :label="$gettext('Ice & mixed')" is-grouped>
                        <form-input :document="document" :field="fields.ice_rating" :prefix="$gettext('ice')" helper="ice_rating"/>
                        <form-input :document="document" :field="fields.mixed_rating" :prefix="$gettext('mixed')" helper="mixed_rating"/>
                    </form-row>

                    <form-input-row :document="document" :field="fields.snowshoe_rating" helper="snowshoe_rating"/>
                    <form-input-row :document="document" :field="fields.via_ferrata_rating" helper="via_ferrata_rating"/>
                    <form-input-row :document="document" :field="fields.hiking_rating" helper="hiking_rating"/>

                    <form-row :label="$gettext('MTB ratings')" is-grouped>
                        <form-input :document="document" :field="fields.mtb_down_rating" :prefix="$gettext('down')" helper="mtb_down_rating"/>
                        <form-input :document="document" :field="fields.mtb_up_rating" :prefix="$gettext('up')" helper="mtb_up_rating"/>
                    </form-row>

                    <form-row :label="$gettext('Exposition & engagement')" is-grouped>
                        <form-input :document="document" :field="fields.equipment_rating" :prefix="$gettext('equipment')" helper="equipment_rating"/>
                        <form-input :document="document" :field="fields.ski_exposition" :prefix="$gettext('ski_exposition')" helper="ski_exposition"/>
                        <form-input :document="document" :field="fields.engagement_rating" :prefix="$gettext('engagement_rating')" helper="engagement_rating"/>
                        <form-input :document="document" :field="fields.risk_rating" :prefix="$gettext('risk_rating')" helper="risk_rating"/>
                        <form-input :document="document" :field="fields.exposition_rock_rating" :prefix="$gettext('exposition_rock_rating')" helper="exposition_rock_rating"/>
                        <form-input :document="document" :field="fields.hiking_mtb_exposition" :prefix="$gettext('hiking_mtb_exposition')" helper="hiking_mtb_exposition"/>
                    </form-row>


                    <!-- TODO slope -->
                </tab-item>

                <tab-item :title="$gettext('Comments')">
                    <form-input-row :document="document" :field="fields.summary"/>
                    <form-input-row :document="document" :field="fields.route_history"/>
                    <form-input-row :document="document" :field="fields.description"/>
                    <form-input-row :document="document" :field="fields.slackline_anchor1"/>
                    <form-input-row :document="document" :field="fields.slackline_anchor2"/>
                    <form-input-row :document="document" :field="fields.remarks"/>
                    <form-input-row :document="document" :field="fields.gear" helper="specific gear"/>
                    <form-input-row :document="document" :field="fields.glacier_gear" class="is-narrow"/>
                    <form-input-row :document="document" :field="fields.external_resources"/>
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
