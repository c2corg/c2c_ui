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

                <form-row :label="$gettext('Dates')" is-grouped>
                    <form-input :document="document" :field="fields.date_start" prefix="start" @input="handleDates"/>
                    <input-checkbox v-model="showBothDates">{{ $gettext('Several days?') }}</input-checkbox>
                    <form-input v-show="showBothDates" :document="document" :field="fields.date_end" prefix="end"/>
                </form-row>

                <form-input-row :document="document" :field="fields.description" :label="$gettext('personal comments')" :placeholder="$gettext('write your comments')"/>

                <associations-input-row :label="$gettext('participants')" :document="document" :field="fields.users" />
                <associations-input-row :label="$gettext('Routes')" :document="document" :field="fields.routes" />

                <quality-input-row :document="document" />

            </tab-item>

            <tab-item :title="$gettext('GPS Track')">
                <map-input-row :document="document" geom-detail-editable/>
            </tab-item>

            <tab-item :title="$gettext('detailled informations')">
                <form-input-row :document="document" :field="fields.activities"/>

                <form-input-row :document="document" :field="fields.partial_trip" />
                <form-input-row :document="document" :field="fields.length_total" />

                <form-row :label="$gettext('Elevation')" is-grouped>
                    <form-input :document="document" :field="fields.elevation_min" prefix="min"/>
                    <form-input :document="document" :field="fields.elevation_max" prefix="max"/>
                </form-row>

                <form-row :label="$gettext('height_diff')" is-grouped>
                    <form-input :document="document" :field="fields.height_diff_up" prefix="up"/>
                    <form-input :document="document" :field="fields.height_diff_down" prefix="down"/>
                </form-row>

                <form-input-row :document="document" :field="fields.height_diff_difficulties"/>

                <form-input-row :document="document" :field="fields.global_rating"/>

                <form-input-row :document="document" :field="fields.rock_free_rating"/>
                <form-input-row :document="document" :field="fields.engagement_rating"/>
                <form-input-row :document="document" :field="fields.equipment_rating"/>

                <form-row :label="$gettext('ski_rating')" :helper="fields.ski_rating.helper">
                    <form-input
                        :document="document"
                        :field="fields.ski_rating"
                        :helper="null"
                        prefix="?"
                        @click:prefix="showCotometer"/>
                </form-row>

                <form-input-row :document="document" :field="fields.labande_global_rating"/>
                <form-input-row :document="document" :field="fields.snowshoe_rating"/>

                <form-input-row :document="document" :field="fields.ice_rating"/>
                <form-input-row :document="document" :field="fields.via_ferrata_rating"/>
                <form-input-row :document="document" :field="fields.hiking_rating"/>

                <form-row :label="$gettext('MTB rating')" is-grouped>
                    <form-input :document="document" :field="fields.mtb_down_rating" prefix="down"/>
                    <form-input :document="document" :field="fields.mtb_up_rating" prefix="up"/>
                </form-row>
            </tab-item>

            <tab-item :title="$gettext('weather and conditions')">
                <!-- TODO conditions levels -->
                <form-row :label="$gettext('condition_rating')" is-grouped>
                    <form-input :document="document" :field="fields.condition_rating"/>
                    <form-input :document="document" :field="fields.glacier_rating" :prefix="$gettext('glacier')"/>
                </form-row>

                <form-input-row :document="document" :field="fields.elevation_up_snow"/>
                <form-input-row :document="document" :field="fields.elevation_down_snow"/>

                <form-row :label="$gettext('Snow')" is-grouped>
                    <form-input :document="document" :field="fields.snow_quantity" prefix="quantity"/>
                    <form-input :document="document" :field="fields.snow_quality" prefix="quality"/>
                </form-row>

                <form-input-row :document="document" :field="fields.conditions" :placeholder="$gettext('describe conditions')"/>

                <form-input-row :document="document" :field="fields.avalanches" />
                <form-input-row :document="document" :field="fields.avalanche_signs"/>

                <form-input-row :document="document" :field="fields.weather" :placeholder="$gettext('describe weather')"/>

                <form-input-row :document="document" :field="fields.conditions_levels" />

            </tab-item>

            <tab-item :title="$gettext('access')">
                <form-input-row :document="document" :field="fields.public_transport" />
                <form-input-row :document="document" :field="fields.frequentation"/>
                <form-input-row :document="document" :field="fields.hut_comment" />
                <form-input-row :document="document" :field="fields.hut_status" />
                <form-input-row :document="document" :field="fields.elevation_access" />
                <form-input-row :document="document" :field="fields.access_condition" />
                <form-input-row :document="document" :field="fields.access_comment" />
                <form-input-row :document="document" :field="fields.lift_status" />
            </tab-item>

            <tab-item :title="$gettext('comments')">

                <form-row :label="$gettext('participants')" is-grouped>
                    <form-input :document="document" :field="fields.participant_count" :prefix="$gettext('count')"/>
                    <form-input :document="document" :field="fields.participants" :prefix="$gettext('Without c2c account')" is-expanded/>
                </form-row>

                <form-input-row :document="document" :field="fields.route_description" :placeholder="$gettext('describe route_conditions')"/>
                <form-input-row :document="document" :field="fields.timing" :placeholder="$gettext('describe timing')"/>
                <form-input-row :document="document" :field="fields.disable_comments" />
            </tab-item>

        </tab-view>

        <!-- TODO where is that ??
            <form-input-row :document="document" :field="fields.summary"/>
        -->
        <cotometer-window ref="cotometerWindow" v-if="document" v-model="document.ski_rating"/>
    </edition-container>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin'
    import CotometerWindow from './utils/CotometerWindow'

    export default {
        components: { CotometerWindow },

        mixins: [ DocumentEditionViewMixin ],

        data() {
            return {
                showBothDates: false
            }
        },

        methods: {
            afterLoad() {
                this.showBothDates = this.document.date_start !== this.document.date_end
            },

            handleDates() {
                if (!this.showBothDates) {
                    this.document.date_end = this.document.date_start
                }
            },

            beforeSave() {
                this.handleDates()
            },

            showCotometer() {
                this.$refs.cotometerWindow.show()
            }
        }
    }

</script>
