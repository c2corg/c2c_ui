<template>

    <div class="columns">

        <div class="column">
            <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.summary"/>
            <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.description"/>
            <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.place"/>
            <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.route_study"/>
            <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.conditions"/>
            <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.training"/>
            <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.motivations"/>
            <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.group_management"/>
            <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.risk"/>
            <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.time_management"/>
            <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.safety"/>
            <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.increase_impact"/>
            <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.reduce_impact"/>
            <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.modifications"/>
            <markdown-section :document="document" :locale="locale" :field="objectDefinition.localeFields.other_comments"/>
        </div>

        <div class="column is-3">
            <information-item>
                <areas-links :areas="document.areas"/>
            </information-item>

            <information-item>
                <activities :activities="document.activities"/>
            </information-item>

            <information-item label="author" v-if="document.author">
                <author-link :author="document.author"/>
            </information-item>

            <information-item label="event type">
                {{document.event_type}}
            </information-item>

            <information-item v-if="document.associations.users.length">
                <users-links :users="document.associations.users"/>
            </information-item>

            <simple-information-item label="avalanche level" :content="document.avalanche_level"/>
            <simple-information-item label="avalanche slope" :content="document.avalanche_slope"/>
            <distance-information-item label="elevation" :content="document.elevation"/>
            <simple-information-item label="count of impacted people" :content="document.nb_participants"/>
            <simple-information-item label="count of participants" :content="document.nb_impacted"/>
            <simple-information-item label="rescue" :content="document.rescue"/>
            <simple-information-item label="severity" :content="document.severity"/>

            <document-license :document="document" cc="by-nc-nd"/>
        </div>
    </div>
</template>

<script>
    import MarkdownSection from './utils/MarkdownSection'
    import Activities from '@/components/utils/Activities'
    import DocumentLicense from '@/components/utils/DocumentLicense'
    import Gallery from '@/components/utils/Gallery'

    import UsersLinks from '@/components/views/document/utils/UsersLinks'
    import AreasLinks from '@/components/views/document/utils/AreasLinks'
    import InformationItem from '@/components/views/document/utils/InformationItem'
    import SimpleInformationItem from '@/components/views/document/utils/SimpleInformationItem'
    import DistanceInformationItem from '@/components/views/document/utils/DistanceInformationItem'
    import AuthorLink from '@/components/views/document/utils/AuthorLink'

    export default {

        components: {
            MarkdownSection,
            Activities,
            DocumentLicense,
            Gallery,
            AreasLinks,
            UsersLinks,
            InformationItem,
            SimpleInformationItem,
            AuthorLink,
            DistanceInformationItem
        },

        props:["document", "locale", "objectDefinition"]
    }
</script>
