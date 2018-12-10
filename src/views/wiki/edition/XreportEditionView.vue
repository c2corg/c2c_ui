<template>
    <edition-container
        :mode="mode"
        :is-loading="!!promise.loading"
        :document="document"
        :generic-errors="genericErrors"
        @save="save">

        <tab-view>

            <tab-item :title="$gettext('Comments')">
                <form-input-row :document="document" :field="fields.title"/>
                <form-input-row :document="document" :field="fields.activities"/>
            </tab-item>

            <tab-item :title="$gettext('Geolocation')">

                <form-row :label="$gettext('Terrain')" is-grouped always-visible>
                    <form-input :document="document" :field="fields.elevation" :prefix="$gettext('elevation')"/>
                    <input-simple type="number" :prefix="$gettext('Longitude')" postfix="°E" v-model="longitude" @input="setGeometryPoint"/>
                    <input-simple type="number" :prefix="$gettext('Latitude')" postfix="°N" v-model="latitude" @input="setGeometryPoint"/>
                </form-row>

                <map-input-row :document="document" geom-detail-editable/>
            </tab-item>

            <tab-item :title="$gettext('General informations')">
                <form-input-row :document="document" :field="fields.date" />
                <form-input-row :document="document" :field="fields.event_type"/>
                <form-input-row :document="document" :field="fields.nb_participants" />
                <form-input-row :document="document" :field="fields.nb_impacted"/>
                <form-input-row :document="document" :field="fields.severity"/>
                <form-input-row :document="document" :field="fields.rescue"/>
                <form-input-row :document="document" :field="fields.avalanche_level"/>
                <form-input-row :document="document" :field="fields.avalanche_slope"/>
            </tab-item>

            <tab-item :title="$gettext('General informations')">
                <form-input-row :document="document" :field="fields.age" />
                <form-input-row :document="document" :field="fields.gender" />
                <form-input-row :document="document" :field="fields.author_status"/>
                <form-input-row :document="document" :field="fields.autonomy"/>
                <form-input-row :document="document" :field="fields.activity_rate" />
                <form-input-row :document="document" :field="fields.nb_outings" />
                <form-input-row :document="document" :field="fields.previous_injuries" />
            </tab-item>

            <tab-item :title="$gettext('Description')">
                <form-input-row :document="document" :field="fields.summary"/>
                <form-input-row :document="document" :field="fields.description"/>
                <form-input-row :document="document" :field="fields.anonymous" />
            </tab-item>

            <tab-item :title="$gettext('Factors')">
                <form-input-row :document="document" :field="fields.place" />
                <form-input-row :document="document" :field="fields.route_study" />
                <form-input-row :document="document" :field="fields.conditions" />
                <form-input-row :document="document" :field="fields.training" />
                <form-input-row :document="document" :field="fields.motivations" />
                <form-input-row :document="document" :field="fields.group_management" />
                <form-input-row :document="document" :field="fields.risk" />
                <form-input-row :document="document" :field="fields.time_management" />
                <form-input-row :document="document" :field="fields.safety"/>
                <form-input-row :document="document" :field="fields.reduce_impact"/>
                <form-input-row :document="document" :field="fields.increase_impact"/>
                <form-input-row :document="document" :field="fields.modifications"/>
                <form-input-row :document="document" :field="fields.other_comments" />
                <form-input-row :document="document" :field="fields.disable_comments" />
            </tab-item>

            <tab-item :title="$gettext('associations')">
                <associations-input-row :document="document" :field="fields.articles" />
                <associations-input-row :document="document" :field="fields.routes" />
                <associations-input-row :document="document" :field="fields.outings" />
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
