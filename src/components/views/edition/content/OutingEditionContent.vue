<template>
    <div>
        <tab-view>

            <tab-item title="Comments">
                <div class="field">
                      <div class="control">
                          <h2>Title</h2>
                          <input class="input is-primary" type="text" v-model="locale.title">
                      </div>
                </div>

                <input-markdown :document="document" :locale="locale" :field="localeFields.summary"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.description"/>
                <input-base :document="document" :locale="locale" :field="localeFields.participants"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.access_comment"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.weather"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.timing"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.conditions_levels"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.conditions"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.hut_comment"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.route_description"/>
                <input-markdown :document="document" :locale="locale" :field="localeFields.avalanches"/>

            </tab-item>

            <tab-item title="Outing">

                <input-base :document="document" :field="fields.access_condition" />
                <input-base :document="document" :field="fields.activities" />
                <input-base :document="document" :field="fields.avalanche_signs" />
                <input-base :document="document" :field="fields.condition_rating" />
                <input-base :document="document" :field="fields.date_end" />
                <input-base :document="document" :field="fields.date_start" />
                <input-base :document="document" :field="fields.disable_comments" />
                <input-base :document="document" :field="fields.elevation_access" />
                <input-base :document="document" :field="fields.elevation_down_snow" />
                <input-base :document="document" :field="fields.elevation_max" />
                <input-base :document="document" :field="fields.elevation_min" />
                <input-base :document="document" :field="fields.elevation_up_snow" />
                <input-base :document="document" :field="fields.engagement_rating" />
                <input-base :document="document" :field="fields.equipment_rating" />
                <input-base :document="document" :field="fields.frequentation" />
                <input-base :document="document" :field="fields.glacier_rating" />
                <input-base :document="document" :field="fields.global_rating" />
                <input-base :document="document" :field="fields.height_diff_difficulties" />
                <input-base :document="document" :field="fields.height_diff_down" />
                <input-base :document="document" :field="fields.height_diff_up" />
                <input-base :document="document" :field="fields.hiking_rating" />
                <input-base :document="document" :field="fields.hut_status" />
                <input-base :document="document" :field="fields.ice_rating" />
                <input-base :document="document" :field="fields.labande_global_rating" />
                <input-base :document="document" :field="fields.length_total" />
                <input-base :document="document" :field="fields.lift_status" />
                <input-base :document="document" :field="fields.mtb_down_rating" />
                <input-base :document="document" :field="fields.mtb_up_rating" />
                <input-base :document="document" :field="fields.partial_trip" />
                <input-base :document="document" :field="fields.participant_count" />
                <input-base :document="document" :field="fields.public_transport" />
                <input-base :document="document" :field="fields.quality" />
                <input-base :document="document" :field="fields.rock_free_rating" />
                <input-base :document="document" :field="fields.ski_rating" />
                <input-base :document="document" :field="fields.snow_quality" />
                <input-base :document="document" :field="fields.snow_quantity" />
                <input-base :document="document" :field="fields.snowshoe_rating" />
                <input-base :document="document" :field="fields.via_ferrata_rating" />

            </tab-item>

        </tab-view>
    </div>
</template>

<script>

    import TabView from './utils/TabView'
    import TabItem from './utils/TabItem'

    import InputBase from './utils/InputBase'
    import InputMarkdown from './utils/InputMarkdown'

    export default {
        components:{
            TabView,
            TabItem,
            InputBase,
            InputMarkdown,
        },

        props : ["document", "locale", "objectDefinition"],

        data(){
            return {
                fields : this.objectDefinition.fields,
                localeFields : this.objectDefinition.localeFields,
            }
        },
    }
</script>
