<template>

    <div class="columns">
        <div class="column is-3">

            <content-box>
                <label-value label="Activities">
                    <activities :activities="document.activities"/>
                </label-value>

                <label-value label="author" v-if="document.author">
                    <author-link :author="document.author"/>
                </label-value>

                <field-view :document="document" :field="fields.event_type"/>

                <label-value v-if="document.associations.users.length" label="participants">
                    <users-links :users="document.associations.users"/>
                </label-value>

                <field-view :document="document" :field="fields.avalanche_level"/>
                <field-view :document="document" :field="fields.avalanche_slope"/>
                <field-view :document="document" :field="fields.elevation"/>
                <field-view :document="document" :field="fields.nb_participants"/>
                <field-view :document="document" :field="fields.nb_impacted"/>
                <field-view :document="document" :field="fields.rescue"/>
                <field-view :document="document" :field="fields.severity"/>
            </content-box>

            <map-box :document="document"></map-box>

            <license-box cc="by-nc-nd"></license-box>
        </div>

        <div class="column">
            <content-box>
                <markdown-section :document="document" :locale="locale" :field="fields.summary"/>
                <markdown-section :document="document" :locale="locale" :field="fields.description"/>
                <markdown-section :document="document" :locale="locale" :field="fields.place"/>
                <markdown-section :document="document" :locale="locale" :field="fields.route_study"/>
                <markdown-section :document="document" :locale="locale" :field="fields.conditions"/>
                <markdown-section :document="document" :locale="locale" :field="fields.training"/>
                <markdown-section :document="document" :locale="locale" :field="fields.motivations"/>
                <markdown-section :document="document" :locale="locale" :field="fields.group_management"/>
                <markdown-section :document="document" :locale="locale" :field="fields.risk"/>
                <markdown-section :document="document" :locale="locale" :field="fields.time_management"/>
                <markdown-section :document="document" :locale="locale" :field="fields.safety"/>
                <markdown-section :document="document" :locale="locale" :field="fields.increase_impact"/>
                <markdown-section :document="document" :locale="locale" :field="fields.reduce_impact"/>
                <markdown-section :document="document" :locale="locale" :field="fields.modifications"/>
                <markdown-section :document="document" :locale="locale" :field="fields.other_comments"/>
            </content-box>

            <comments-box :document="document" :locale="locale" />

        </div>
    </div>
</template>

<script>
    import UsersLinks from './utils/UsersLinks'
    import LicenseBox from './utils/LicenseBox'
    import MapBox from './utils/MapBox'
    import MarkdownSection from './utils/MarkdownSection'
    import LabelValue from './utils/LabelValue'
    import FieldView from './utils/FieldView'

    import CommentsBox from './utils/CommentsBox'

    export default {

        components: {
            LicenseBox,
            MapBox,
            UsersLinks,

            MarkdownSection,
            LabelValue,
            FieldView,
            CommentsBox,
        },

        props:["document", "locale", "fields"],
    }
</script>
