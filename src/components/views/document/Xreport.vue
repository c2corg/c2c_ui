<template>
    <div v-if="xreport" class="section content">
        <h1>
            <i class="far fa-file-alt"></i>
            <document-title :document="xreport"/>
            <small>{{xreport.date_start}}</small>
        </h1>

        <div class="columns">

            <div class="column">
                <markdown-section :markdown="xreport.locales[0].summary" title="summary"/>
                <markdown-section :markdown="xreport.locales[0].description" title="description"/>
                <markdown-section :markdown="xreport.locales[0].place" title="place"/>
                <markdown-section :markdown="xreport.locales[0].route_study" title="route study"/>
                <markdown-section :markdown="xreport.locales[0].conditions" title="conditions study"/>
                <markdown-section :markdown="xreport.locales[0].training" title="training"/>
                <markdown-section :markdown="xreport.locales[0].motivations" title="motivations"/>
                <markdown-section :markdown="xreport.locales[0].group_management" title="group management"/>
                <markdown-section :markdown="xreport.locales[0].risk" title="risk"/>
                <markdown-section :markdown="xreport.locales[0].time_management" title="time management"/>
                <markdown-section :markdown="xreport.locales[0].safety" title="safety"/>
                <markdown-section :markdown="xreport.locales[0].increase_impact" title="increase impact"/>
                <markdown-section :markdown="xreport.locales[0].reduce_impact" title="reduce impact"/>
                <markdown-section :markdown="xreport.locales[0].modifications" title="modifications"/>
                <markdown-section :markdown="xreport.locales[0].other_comments" title="other comments"/>
            </div>

            <div class="column is-3">
                <information-item>
                    <areas-links :areas="xreport.areas"/>
                </information-item>

                <information-item>
                    <activities :activities="xreport.activities"/>
                </information-item>

                <information-item label="author" v-if="xreport.author">
                    <author-link :author="xreport.author"/>
                </information-item>

                <information-item label="event type">
                    {{xreport.event_type}}
                </information-item>

                <information-item label="event type" v-if="xreport.associations.users.length">
                    <users-links :users="xreport.associations.users"/>
                </information-item>

                <simple-information-item label="avalanche level" :content="xreport.avalanche_level"/>
                <simple-information-item label="avalanche slope" :content="xreport.avalanche_slope"/>
                <distance-information-item label="elevation" :content="xreport.elevation"/>
                <simple-information-item label="count of impacted people" :content="xreport.nb_participants"/>
                <simple-information-item label="count of participants" :content="xreport.nb_impacted"/>
                <simple-information-item label="rescue" :content="xreport.rescue"/>
                <simple-information-item label="severity" :content="xreport.severity"/>

                <document-license :document="xreport" cc="by-nc-nd"/>
            </div>
        </div>

    </div>

</template>

<script>
    import MarkdownSection from '@/components/utils/MarkdownSection'
    import DocumentTitle from '@/components/utils/DocumentTitle'
    import Activities from '@/components/utils/Activities'
    import DocumentLicense from '@/components/utils/DocumentLicense'
    import Gallery from '@/components/utils/Gallery'

    import UsersLinks from '@/components/views/document/utils/UsersLinks'
    import AreasLinks from '@/components/views/document/utils/AreasLinks'
    import InformationItem from '@/components/views/document/utils/InformationItem'
    import SimpleInformationItem from '@/components/views/document/utils/SimpleInformationItem'
    import DistanceInformationItem from '@/components/views/document/utils/DistanceInformationItem'
    import AuthorLink from '@/components/views/document/utils/AuthorLink'

    import c2c from '@/js/c2c.js'

    export default {

        components: {
            MarkdownSection,
            DocumentTitle,
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

        data() {
            return {
                xreport: null,
            }
        },

        created() {
            c2c.xreport.get(this.$route.params.id).then(response => {this.xreport=response.data});
        }

    }
</script>
