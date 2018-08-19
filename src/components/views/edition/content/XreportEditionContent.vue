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

                <input-markdown :document="document" :locale="locale" :field="localeFields.place" />
                <input-markdown :document="document" :locale="locale" :field="localeFields.route_study" />
                <input-markdown :document="document" :locale="locale" :field="localeFields.conditions" />
                <input-markdown :document="document" :locale="locale" :field="localeFields.training" />
                <input-markdown :document="document" :locale="locale" :field="localeFields.motivations" />
                <input-markdown :document="document" :locale="locale" :field="localeFields.group_management" />
                <input-markdown :document="document" :locale="locale" :field="localeFields.risk" />
                <input-markdown :document="document" :locale="locale" :field="localeFields.time_management" />
                <input-markdown :document="document" :locale="locale" :field="localeFields.safety" />
                <input-markdown :document="document" :locale="locale" :field="localeFields.reduce_impact" />
                <input-markdown :document="document" :locale="locale" :field="localeFields.modifications" />
                <input-markdown :document="document" :locale="locale" :field="localeFields.other_comments" />


            </tab-item>

            <tab-item title="Waypoint">
                <input-base :document="document" :field="fields.elevation" />
                <input-base :document="document" :field="fields.date" />
                <input-base :document="document" :field="fields.event_type" />
                <input-base :document="document" :field="fields.activities" />
                <input-base :document="document" :field="fields.nb_participants" />
                <input-base :document="document" :field="fields.nb_impacted" />
                <input-base :document="document" :field="fields.rescue" />
                <input-base :document="document" :field="fields.avalanche_level" />
                <input-base :document="document" :field="fields.avalanche_slope" />
                <input-base :document="document" :field="fields.severity" />
                <input-base :document="document" :field="fields.author_status" />
                <input-base :document="document" :field="fields.activity_rate" />
                <input-base :document="document" :field="fields.nb_outings" />
                <input-base :document="document" :field="fields.age" />
                <input-base :document="document" :field="fields.gender" />
                <input-base :document="document" :field="fields.previous_injuries" />
                <input-base :document="document" :field="fields.autonomy" />
                <input-base :document="document" :field="fields.disable_comments" />
                <input-base :document="document" :field="fields.anonymous" />
                <input-base :document="document" :field="fields.quality" />

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
