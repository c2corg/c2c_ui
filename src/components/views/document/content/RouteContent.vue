<template>

    <div class="columns">
        <div class="column is-9">
            <!--   CONTENT  -->

            <markdown-section :markdown="locale.summary" class="summary"/>
            <markdown-section :markdown="locale.route_history" title="History"/>
            <markdown-section :markdown="locale.description" title="Description"/>
            <markdown-section :markdown="locale.slackline_anchor1" title="Anchor 1"/>
            <markdown-section :markdown="locale.slackline_anchor2" title="Anchor 2"/>
            <markdown-section :markdown="locale.remarks" title="Remarks"/>
            <markdown-section :markdown="locale.gear" title="Gears"/>

            <div class="hidden-print" v-if="document.associations.recent_outings.documents.length!=0">
                <h2>
                    <span>Recent outings</span>
                </h2>
                <pretty-outing-link
                   v-for="outing of document.associations.recent_outings.documents"
                   :outing="outing"
                   :key="outing.document_id"/>
            </div>

            <div class="hidden-print" v-if="document.associations.books.length!=0">
                <h2>
                    <span>Books</span>
                </h2>
                <ul>
                    <li v-for="book of document.associations.books" :key="book.document_id">
                        <i>{{book.locales[0].title}}</i>, {{book.author}}
                    </li>
                </ul>
            </div>

        </div>

        <div class="column is-3">
            <areas-links :areas="document.areas"/>
            <information-item label="Credits">
                <document-license :document="document" cc="by-sa"/>
            </information-item>

            <information-item label="activities">
                <activities :activities="document.activities"/>
            </information-item>

            <information-item label="ratings">
                <route-rating :route="document"/>
                <span v-if="document.hiking_rating">
                    {{document.hiking_rating}}
                </span>
            </information-item>

            <simple-information-item label="slackline type" :content="document.slackline_type"/>
            <distance-information-item label="difficulties height" :content="document.height_diff_difficulties"/>

            <information-item label="route type"  v-if="document.route_types">
                {{document.route_types.join(', ')}}
            </information-item>

            <simple-information-item label="glacier gears" :content="document.glacier_gear"/>
            <information-item label="configuration"  v-if="document.configuration">
                {{document.configuration.join(', ')}}
            </information-item>

            <information-item label="orientation"  v-if="document.orientations">
                {{document.orientations.join(', ')}}
            </information-item>

            <information-item label="height difference"  v-if="document.height_diff_up || document.height_diff_down">
                <span v-if="document.height_diff_up">+{{document.height_diff_up}}&#8239;m</span>
                <span v-if="document.height_diff_up && document.height_diff_down">/</span>
                <span v-if="document.height_diff_down">-{{document.height_diff_down}}&#8239;m</span>
            </information-item>

            <div v-if="document.elevation_min || document.elevation_max">
                <label>
                    <span>elevation</span>
                    <span v-if="document.elevation_min">min</span><span v-if="document.elevation_min && document.elevation_max">/</span><span v-if="document.elevation_max">max</span>
                </label>
                <span v-if="document.elevation_min">{{document.elevation_min}}&#8239;m</span>
                <span v-if="document.elevation_min && document.elevation_max">/</span>
                <span v-if="document.elevation_max">{{document.elevation_max}}&#8239;m</span>
            </div>

            <distance-information-item label="route length"  :content="document.route_length"/>
            <distance-information-item label="slackline height"  :content="document.slackline_height"/>
            <div v-if="document.associations">
                <strong>Waypoints</strong>
                <div v-for="waypoint of document.associations.waypoints"
                     :key="waypoint.document_id">
                    <document-link :document="waypoint"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import MarkdownSection from '@/components/views/document/utils/MarkdownSection'
    import Activities from '@/components/utils/Activities'
    import RouteRating from '@/components/utils/RouteRating'
    import AreasLinks from '@/components/views/document/utils/AreasLinks'
    import DocumentLicense from '@/components/utils/DocumentLicense'
    import InformationItem from '@/components/views/document/utils/InformationItem'
    import SimpleInformationItem from '@/components/views/document/utils/SimpleInformationItem'
    import DistanceInformationItem from '@/components/views/document/utils/DistanceInformationItem'

    export default {

        components: {
            MarkdownSection,
            Activities,
            DocumentLicense,
            RouteRating,
            AreasLinks,
            SimpleInformationItem,
            InformationItem,
            DistanceInformationItem
        },

        props:["document", "locale"]
    }
</script>
