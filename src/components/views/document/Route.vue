<template>
    <div v-if="route" class="section content">
        <h1>
            <icon-document type="route"/>
            <document-title :document="route"/>
        </h1>

        <!-- ---------------- CONTENT -------------------------------- -->

        <div class="columns">
            <div class="column is-9">
                <!--   CONTENT  -->

                <markdown-section :content="route.locales[0].summary" class="summary"/>
                <markdown-section :markdown="route.locales[0].route_history" title="History"/>
                <markdown-section :markdown="route.locales[0].description" title="Description"/>
                <markdown-section :markdown="route.locales[0].slackline_anchor1" title="Anchor 1"/>
                <markdown-section :markdown="route.locales[0].slackline_anchor2" title="Anchor 2"/>
                <markdown-section :markdown="route.locales[0].remarks" title="Remarks"/>
                <markdown-section :markdown="route.locales[0].gear" title="Gears"/>

                <div class="hidden-print" v-if="route.associations.recent_outings.documents.length!=0">
                    <h2>
                        <span>Recent outings</span>
                    </h2>
                    <pretty-outing-link
                       v-for="outing of route.associations.recent_outings.documents"
                       :outing="outing"
                       :key="outing.document_id"/>
                </div>

                <div class="hidden-print" v-if="route.associations.books.length!=0">
                    <h2>
                        <span>Books</span>
                    </h2>
                    <ul>
                        <li v-for="book of route.associations.books" :key="book.document_id">
                            <i>{{book.locales[0].title}}</i>, {{book.author}}
                        </li>
                    </ul>
                </div>

            </div>

            <div class="column is-3">
                <areas-links :areas="route.areas"/>
                <information-item label="Credits">
                    <document-license :document="route" cc="by-sa"/>
                </information-item>

                <information-item label="activities">
                    <activities :activities="route.activities"/>
                </information-item>

                <information-item label="ratings">
                    <route-rating :route="route"/>
                    <span v-if="route.hiking_rating">
                        {{route.hiking_rating}}
                    </span>
                </information-item>

                <simple-information-item label="slackline type" :content="route.slackline_type"/>
                <distance-information-item label="difficulties height" :content="route.height_diff_difficulties"/>

                <information-item label="route type"  v-if="route.route_types">
                    {{route.route_types.join(', ')}}
                </information-item>

                <simple-information-item label="glacier gears" v-if="route.glacier_gear"/>
                <information-item label="configuration"  v-if="route.configuration">
                    {{route.configuration.join(', ')}}
                </information-item>

                <information-item label="orientation"  v-if="route.orientations">
                    {{route.orientations.join(', ')}}
                </information-item>

                <information-item label="height difference"  v-if="route.height_diff_up || route.height_diff_down">
                    <span v-if="route.height_diff_up">+{{route.height_diff_up}}&#8239;m</span>
                    <span v-if="route.height_diff_up && route.height_diff_down">/</span>
                    <span v-if="route.height_diff_down">-{{route.height_diff_down}}&#8239;m</span>
                </information-item>

                <div v-if="route.elevation_min || route.elevation_max">
                    <label>
                        <span>elevation</span>
                        <span v-if="route.elevation_min">min</span><span v-if="route.elevation_min && route.elevation_max">/</span><span v-if="route.elevation_max">max</span>
                    </label>
                    <span v-if="route.elevation_min">{{route.elevation_min}}&#8239;m</span>
                    <span v-if="route.elevation_min && route.elevation_max">/</span>
                    <span v-if="route.elevation_max">{{route.elevation_max}}&#8239;m</span>
                </div>

                <distance-information-item label="route length"  :content="route.route_length"/>
                <distance-information-item label="slackline height"  :content="route.slackline_height"/>
                <strong>Waypoints</strong>
                <div v-for="waypoint of route.associations.waypoints"
                     :key="waypoint.document_id">
                    <document-link :document="waypoint"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import MarkdownSection from '@/components/utils/MarkdownSection'
    import Activities from '@/components/utils/Activities'
    import RouteRating from '@/components/utils/RouteRating'
    import AreasLinks from '@/components/views/document/utils/AreasLinks'
    import DocumentLicense from '@/components/utils/DocumentLicense'
    import InformationItem from '@/components/views/document/utils/InformationItem'
    import SimpleInformationItem from '@/components/views/document/utils/SimpleInformationItem'
    import DistanceInformationItem from '@/components/views/document/utils/DistanceInformationItem'

    import c2c from '@/js/c2c.js'

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

        data() {
            return {
                route: null,
            }
        },

        created() {
            c2c.route.get(this.$route.params.id).then(response => {this.route=response.data});
        }
    }
</script>
