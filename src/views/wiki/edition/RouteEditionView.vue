<template>
    <edition-container
        :mode="mode"
        :is-loading="!!promise.loading"
        :document="document"
        :generic-errors="genericErrors"
        @save="save">

        <tab-view>
            <tab-item :title="$gettext('general informations')">
                <form-input-row :document="document" :field="fields.title" is-expanded/>
                <form-input-row :document="document" :field="fields.activities"/>
                <form-input-row :document="document" :field="fields.climbing_outdoor_type"/>

                <map-input-row :document="document" geom-detail-editable/>

                <form-input-row
                    :label="$gettext('main waypoint')"
                    :document="document"
                    :field="fields.main_waypoint_id"/>

                <associations-input-row
                    :label="$gettext('waypoints')"
                    :document="document"
                    :field="fields.waypoints" />

                <associations-input-row :document="document" :field="fields.routes" />
                <associations-input-row :document="document" :field="fields.articles" />
                <associations-input-row :document="document" :field="fields.books" />
                <associations-input-row :document="document" :field="fields.xreports" />

                <quality-input-row :document="document" />

            </tab-item>

            <tab-item :title="$gettext('configuration')">
                <form-input-row :document="document" :field="fields.orientations"/>
                <form-input-row :document="document" :field="fields.route_types"/>
                <form-input-row :document="document" :field="fields.configuration"/>
                <form-input-row :document="document" :field="fields.rock_types"/>
            </tab-item>

            <tab-item :title="$gettext('numbers')">
                <form-row :label="$gettext('elevation')" is-grouped helper="1063027#height-diff_up">
                    <form-input :document="document" :field="fields.elevation_min" :prefix="$gettext('min')" />
                    <form-input :document="document" :field="fields.elevation_max" :prefix="$gettext('max')" />
                </form-row>

                <form-row :label="$gettext('height_diff')" is-grouped>
                    <form-input :document="document" :field="fields.height_diff_up" :prefix="$gettext('up')"/>
                    <form-input :document="document" :field="fields.height_diff_down" :prefix="$gettext('down')"/>
                </form-row>

                <form-input-row :document="document" :field="fields.height_diff_access"/>
                <form-input-row :document="document" :field="fields.height_diff_difficulties"/>
                <form-input-row :document="document" :field="fields.difficulties_height"/>
                <form-input-row :document="document" :field="fields.route_length"/>
                <form-input-row :document="document" :field="fields.mtb_length_asphalt"/>
                <form-input-row :document="document" :field="fields.mtb_length_trail"/>
                <form-input-row :document="document" :field="fields.mtb_height_diff_portages"/>
                <form-input-row :document="document" :field="fields.durations"/>
                <form-input-row :document="document" :field="fields.lift_access"/>

                <form-input-row :document="document" :field="fields.slackline_type"/>
                <form-input-row :document="document" :field="fields.slackline_height"/>
            </tab-item>

            <tab-item :title="$gettext('ratings')">

                <form-input-row :document="document" :field="fields.global_rating"/>

                <form-row :label="$gettext('Climbing ratings')" is-grouped>
                    <form-input :document="document" :field="fields.rock_free_rating" :prefix="$gettext('free', 'free climbing rating')"/>
                    <form-input :document="document" :field="fields.rock_required_rating" :prefix="$gettext('required', 'required climbing rating')"/>
                    <form-input :document="document" :field="fields.aid_rating" :prefix="$gettext('aid', 'aid climbing rating')"/>
                </form-row>

                <form-input-row :document="document" :field="fields.labande_global_rating"/>
                <form-input-row :document="document" :field="fields.labande_ski_rating"/>
                <form-input-row :document="document" :field="fields.ski_rating"/>

                <form-row :label="$gettext('Ice & mixed')" is-grouped>
                    <form-input :document="document" :field="fields.ice_rating" :prefix="$gettext('ice')" />
                    <form-input :document="document" :field="fields.mixed_rating" :prefix="$gettext('mixed')"/>
                </form-row>

                <form-input-row :document="document" :field="fields.snowshoe_rating"/>
                <form-input-row :document="document" :field="fields.via_ferrata_rating"/>
                <form-input-row :document="document" :field="fields.hiking_rating"/>

                <form-row :label="$gettext('MTB ratings')" is-grouped>
                    <form-input :document="document" :field="fields.mtb_down_rating" :prefix="$gettext('down')"/>
                    <form-input :document="document" :field="fields.mtb_up_rating" :prefix="$gettext('up')"/>
                </form-row>

                <form-row :label="$gettext('Exposition & engagement')" is-grouped>
                    <form-input :document="document" :field="fields.equipment_rating" :prefix="$gettext('equipment')"/>
                    <form-input :document="document" :field="fields.ski_exposition" :prefix="$gettext('ski_exposition')"/>
                    <form-input :document="document" :field="fields.engagement_rating" :prefix="$gettext('engagement_rating')"/>
                    <form-input :document="document" :field="fields.risk_rating" :prefix="$gettext('risk_rating')"/>
                    <form-input :document="document" :field="fields.exposition_rock_rating" :prefix="$gettext('exposition_rock_rating')"/>
                    <form-input :document="document" :field="fields.hiking_mtb_exposition" :prefix="$gettext('hiking_mtb_exposition')"/>
                </form-row>

                <!-- TODO slope -->
            </tab-item>

            <tab-item :title="$gettext('Comments')">
                <form-input-row :document="document" :field="fields.summary"/>
                <form-input-row :document="document" :field="fields.route_history" :placeholder="$gettext('Describe historical information about the route (date, names..) here')"/>
                <form-input-row :document="document" :field="fields.description"/>
                <form-input-row :document="document" :field="fields.slackline_anchor1"/>
                <form-input-row :document="document" :field="fields.slackline_anchor2"/>
                <form-input-row :document="document" :field="fields.remarks"/>
                <form-input-row :document="document" :field="fields.gear" :placeholder="$gettext('Describe here the gear needed for this route')"/>
                <form-input-row :document="document" :field="fields.glacier_gear"/>
                <form-input-row :document="document" :field="fields.external_resources" :placeholder="$gettext('Books and websites not already associated to this route')"/>
            </tab-item>

        </tab-view>

    </edition-container>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin'

    export default {
        mixins: [ DocumentEditionViewMixin ]
    }

</script>
