<template>
    <edition-container>
        <template slot-scope="{ document, fields }">

            <tab-view>

                <tab-item :title="$gettext('Comments')">
                    <form-input-row :document="document" :field="fields.title"/>
                    <form-input-row :document="document" :field="fields.activities" helper="activities"/>
                </tab-item>

                <tab-item :title="$gettext('Geolocation')">
                    <form-input-row :document="document" :field="fields.elevation" />
                </tab-item>

                <tab-item :title="$gettext('General informations')">
                    <form-input-row :document="document" :field="fields.date" />
                    <form-input-row :document="document" :field="fields.event_type" helper="event_type"/>
                    <form-input-row :document="document" :field="fields.nb_participants" />
                    <form-input-row :document="document" :field="fields.nb_impacted" helper="nb_impacted"/>
                    <form-input-row :document="document" :field="fields.severity" helper="severity"/>
                    <form-input-row :document="document" :field="fields.rescue" helper="rescue"/>
                    <form-input-row :document="document" :field="fields.avalanche_level" helper="avalanche_level"/>
                    <form-input-row :document="document" :field="fields.avalanche_slope" helper="avalanche_slope"/>
                </tab-item>

                <tab-item :title="$gettext('General informations')">
                    <form-input-row :document="document" :field="fields.age" />
                    <form-input-row :document="document" :field="fields.gender" />
                    <form-input-row :document="document" :field="fields.author_status" helper="author_status"/>
                    <form-input-row :document="document" :field="fields.autonomy" helper="autonomy"/>
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
                    <form-input-row :document="document" :field="fields.safety" helper="safety"/>
                    <form-input-row :document="document" :field="fields.reduce_impact" helper="reduce_impact"/>
                    <form-input-row :document="document" :field="fields.increase_impact" helper="increase_impact"/>
                    <form-input-row :document="document" :field="fields.modifications" helper="modifications"/>
                    <form-input-row :document="document" :field="fields.other_comments" />
                    <form-input-row :document="document" :field="fields.disable_comments" />
                </tab-item>
            </tab-view>
        </template>
    </edition-container>
</template>


<script>

import FormComponentsMixin from './utils/FormComponentsMixin'

export default {
    mixins: [ FormComponentsMixin ],
}

</script>
