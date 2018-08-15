<template>

    <div class="columns">

        <div class="column">
            <markdown-section :markdown="locale.summary" title="summary"/>
            <markdown-section :markdown="locale.description" title="description"/>
            <markdown-section :markdown="locale.place" title="place"/>
            <markdown-section :markdown="locale.route_study" title="route study"/>
            <markdown-section :markdown="locale.conditions" title="conditions study"/>
            <markdown-section :markdown="locale.training" title="training"/>
            <markdown-section :markdown="locale.motivations" title="motivations"/>
            <markdown-section :markdown="locale.group_management" title="group management"/>
            <markdown-section :markdown="locale.risk" title="risk"/>
            <markdown-section :markdown="locale.time_management" title="time management"/>
            <markdown-section :markdown="locale.safety" title="safety"/>
            <markdown-section :markdown="locale.increase_impact" title="increase impact"/>
            <markdown-section :markdown="locale.reduce_impact" title="reduce impact"/>
            <markdown-section :markdown="locale.modifications" title="modifications"/>
            <markdown-section :markdown="locale.other_comments" title="other comments"/>
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
    import MarkdownSection from '@/components/views/document/utils/MarkdownSection'
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

        props:["document", "locale"]
    }
</script>
