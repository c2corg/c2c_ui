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
                <form-input-row :document="document" :field="fields.description" :placeholder="$gettext('Details of the actual outing and the incident. If you have already written up your outing, you only need to describe the incident, then link it to your outing report (after first uploading it)')"/>
                <form-input-row :document="document" :field="fields.anonymous" />
            </tab-item>

            <tab-item :title="$gettext('Factors')">
                <form-input-row :document="document" :field="fields.place" :placeholder="$gettext('Information on the location of the incident.  Mark the location on the map above, even if you cannot do very accurately, (in which case give more details here).  After completing the report, you can associate it to a route, a climbing site or an outing.')"/>
                <form-input-row :document="document" :field="fields.route_study" :placeholder="$gettext('Maps, guidebooks and outings reports consulted. Evaluation of the route during the outing.')"/>
                <form-input-row :document="document" :field="fields.conditions" :placeholder="$gettext('Describe the information gathered before the outing and how these evolved once on route: weather forecast, avalanche risk reports, amount of refreezing, condition of the snow/ice/rock, reports from the previous days, etc.')"/>
                <form-input-row :document="document" :field="fields.training" :placeholder="$gettext('At the time of the incident, describe your technical level, your physical condition, how tired you had become just prior to the incident, and, if at altitude, how well you were acclimatized, etc.')"/>
                <form-input-row :document="document" :field="fields.motivations" :placeholder="$gettext('Why did you choose this outing? When did you decide to engage. What influenced your decision (holiday time, long journey, hotel/hut bookings, time spent already in preparation, limited possibilities, etc.)?')"/>
                <form-input-row :document="document" :field="fields.group_management" :placeholder="$gettext('Communication of the individual objectives and expectations, the thoughts and observations during the outing, discussions on new strategies, the way the group conducted itself and divided responsibilities, was the group used to working together, core aspirations, etc.')"/>
                <form-input-row :document="document" :field="fields.risk" :placeholder="$gettext('Have you (re)evaluated the risks at each change in the situation? What factors might have affected your awareness, such as tiredness, stress, relaxing having passed the main difficulties or on the descent, on a section reputed to be easy, presence of footprints or other people, complete confidence in the leader of the group, etc.')"/>
                <form-input-row :document="document" :field="fields.time_management" :placeholder="$gettext('Had a timetable for the route been foreseen? Did you maintain the schedule? Was time a factor in causing the incident?')"/>
                <form-input-row :document="document" :field="fields.safety" :placeholder="$gettext('Types of belay and protection used, verifications between climbers, snowpack stability tests, testing of avalanche transceivers, etc.')"/>
                <form-input-row :document="document" :field="fields.reduce_impact" />
                <form-input-row :document="document" :field="fields.increase_impact" />
                <form-input-row :document="document" :field="fields.modifications" />
                <form-input-row :document="document" :field="fields.other_comments" :placeholder="$gettext('Briefly describe any injuries. Comments that do not fit into any other fields can be entered here.')"/>
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
