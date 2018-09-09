<template>

    <div class="columns">

        <div class="column">
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
        </div>

        <div class="column is-3">
            <div>
                <areas-links :areas="document.areas"/>
            </div>

            <div>
                <activities :activities="document.activities"/>
            </div>

            <label-value label="author" v-if="document.author">
                <author-link :author="document.author"/>
            </label-value>

            <field-view :document="document" :field="fields.event_type"/>

            <div v-if="document.associations.users.length">
                <users-links :users="document.associations.users"/>
            </div>

            <field-view :document="document" :field="fields.avalanche_level"/>
            <field-view :document="document" :field="fields.avalanche_slope"/>
            <field-view :document="document" :field="fields.elevation"/>
            <field-view :document="document" :field="fields.nb_participants"/>
            <field-view :document="document" :field="fields.nb_impacted"/>
            <field-view :document="document" :field="fields.rescue"/>
            <field-view :document="document" :field="fields.severity"/>

            <document-comments :document="document" :locale="locale" />

            <document-license :document="document" cc="by-nc-nd"/>
        </div>
    </div>
</template>

<script>
    import UsersLinks from './utils/UsersLinks'
    import AreasLinks from './utils/AreasLinks'

    import MarkdownSection from './utils/MarkdownSection'
    import LabelValue from './utils/LabelValue'
    import FieldView from './utils/FieldView'

    import DocumentComments from './utils/DocumentComments'

    export default {

        components: {
            AreasLinks,
            UsersLinks,

            MarkdownSection,
            LabelValue,
            FieldView,
            DocumentComments,
        },

        props:["document", "locale", "fields"],
    }
</script>
