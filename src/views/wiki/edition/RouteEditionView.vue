<template>
    <edition-container-beta
        :mode="mode"
        :document="document"
        :generic-errors="genericErrors">

        <form-section :title="$gettext('general informations')" expanded @save="save" :is-loading="!!promise.loading" :enable-comment="mode == 'edit'">
            <div class="columns is-multiline">
                <form-field :document="document" :field="fields.title"/>
                <form-field class="is-narrow" :document="document" :field="fields.climbing_outdoor_type"/>
                <form-field class="is-12" :document="document" :field="fields.activities"/>
            </div>

            <map-input-row-beta :document="document" geom-detail-editable/>

            <div class="columns is-multiline">
                <form-field
                    class="is-4"
                    :document="document"
                    :field="fields.main_waypoint_id"/>
            </div>

            <associations-input-row-beta :document="document" :field="fields.waypoints" />
            <associations-input-row-beta :document="document" :field="fields.routes" />
            <associations-input-row-beta :document="document" :field="fields.articles" />
            <associations-input-row-beta :document="document" :field="fields.books" />
            <associations-input-row-beta :document="document" :field="fields.xreports" />

            <quality-input-row-beta :document="document" />

        </form-section>

        <form-section :title="$gettext('configuration')" @save="save" :is-loading="!!promise.loading" :enable-comment="mode == 'edit'">
            <div class="columns is-multiline">
                <form-field class="is-12" :document="document" :field="fields.orientations"/>
                <form-field class="is-12" :document="document" :field="fields.route_types"/>
                <form-field class="is-12" :document="document" :field="fields.configuration"/>
                <form-field class="is-12" :document="document" :field="fields.rock_types"/>
            </div>
        </form-section>

        <form-section :title="$gettext('numbers')" @save="save" :is-loading="!!promise.loading" :enable-comment="mode == 'edit'">
            <div class="columns is-multiline">
                <form-field class="is-6" :document="document" :field="fields.elevation_min" />
                <form-field class="is-6" :document="document" :field="fields.elevation_max" />

                <form-field class="is-6" :document="document" :field="fields.height_diff_up" />
                <form-field class="is-6" :document="document" :field="fields.height_diff_down" />
                <form-field class="is-6" :document="document" :field="fields.height_diff_access"/>
                <form-field class="is-6" :document="document" :field="fields.height_diff_difficulties"/>

                <form-field class="is-6" :document="document" :field="fields.difficulties_height"/>
                <form-field class="is-6" :document="document" :field="fields.route_length"/>

            </div>
            <div class="columns is-multiline">
                <form-field class="is-4" :document="document" :field="fields.mtb_length_asphalt"/>
                <form-field class="is-4" :document="document" :field="fields.mtb_length_trail"/>
                <form-field class="is-4" :document="document" :field="fields.mtb_height_diff_portages"/>
            </div>

            <div class="columns is-multiline">
                <form-field class="is-4" :document="document" :field="fields.lift_access"/>
                <form-field class="is-12" :document="document" :field="fields.durations"/>
            </div>

            <div class="columns is-multiline">
                <form-field class="is-4" :document="document" :field="fields.slackline_type"/>
                <form-field class="is-4" :document="document" :field="fields.slackline_height"/>
            </div>
        </form-section>

        <form-section :title="$gettext('ratings')" @save="save" :is-loading="!!promise.loading" :enable-comment="mode == 'edit'">

            <div class="columns is-multiline">
                <form-field class="is-6" :document="document" :field="fields.global_rating"/>
                <form-field class="is-6" :document="document" :field="fields.rock_free_rating"/>
                <form-field class="is-6" :document="document" :field="fields.rock_required_rating" />
                <form-field class="is-6" :document="document" :field="fields.aid_rating" />
            </div>

            <div class="columns is-multiline">
                <form-field class="is-6" :document="document" :field="fields.labande_global_rating"/>
                <form-field class="is-6" :document="document" :field="fields.labande_ski_rating"/>
                <form-field class="is-6" :document="document" :field="fields.ski_rating"/>
                <form-field class="is-6" :document="document" :field="fields.ski_exposition" />
            </div>

            <div class="columns is-multiline">
                <form-field class="is-6" :document="document" :field="fields.ice_rating" />
                <form-field class="is-6" :document="document" :field="fields.mixed_rating" />
                <form-field class="is-6" :document="document" :field="fields.snowshoe_rating"/>
                <form-field class="is-6" :document="document" :field="fields.via_ferrata_rating"/>
                <form-field class="is-6" :document="document" :field="fields.hiking_rating"/>
            </div>

            <div class="columns is-multiline">
                <form-field :document="document" :field="fields.mtb_down_rating"/>
                <form-field :document="document" :field="fields.mtb_up_rating"/>
                <form-field :document="document" :field="fields.hiking_mtb_exposition" />
            </div>

            <div class="columns is-multiline">
                <form-field class="is-6" :document="document" :field="fields.equipment_rating" />
                <form-field class="is-6" :document="document" :field="fields.engagement_rating" />
                <form-field class="is-6" :document="document" :field="fields.exposition_rock_rating" />
                <form-field class="is-6" :document="document" :field="fields.risk_rating" />
            </div>

            <!-- TODO slope -->
        </form-section>

        <form-section :title="$gettext('Comments')" @save="save" :is-loading="!!promise.loading" :enable-comment="mode == 'edit'">
            <div class="columns is-multiline">
                <form-field class="is-12" :document="document" :field="fields.summary"/>
                <form-field class="is-12" :document="document" :field="fields.route_history" :placeholder="$gettext('Describe historical information about the route (date, names..) here')"/>
                <form-field class="is-12" :document="document" :field="fields.description"/>
                <form-field class="is-12" :document="document" :field="fields.slackline_anchor1"/>
                <form-field class="is-12" :document="document" :field="fields.slackline_anchor2"/>
                <form-field class="is-12" :document="document" :field="fields.remarks"/>
                <form-field class="is-12" :document="document" :field="fields.gear" :placeholder="$gettext('Describe here the gear needed for this route')"/>
                <form-field class="is-12" :document="document" :field="fields.glacier_gear"/>
                <form-field class="is-12" :document="document" :field="fields.external_resources" :placeholder="$gettext('Books and websites not already associated to this route')"/>
            </div>
        </form-section>

    </edition-container-beta>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin'

    export default {
        mixins: [ DocumentEditionViewMixin ]
    }

</script>
