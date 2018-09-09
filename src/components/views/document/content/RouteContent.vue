<template>

    <div class="columns">
        <div class="column is-3">
            <areas-links :areas="document.areas"/>

            <map-view :document="document">
            </map-view>

            <div v-if="document.associations"> <!-- version view does not have associtations...-->
                <strong>Waypoints</strong>
                <div v-for="waypoint of document.associations.waypoints" :key="waypoint.document_id">
                    <document-link :document="waypoint"/>
                </div>

            </div>

            <strong>Maps</strong>
            <div v-for="map of document.maps" :key="map.document_id">
                <document-link :document="map"/>
            </div>

            <document-license :document="document" cc="by-sa"/>

        </div>

        <div class="column is-9">
            <!--   CONTENT  -->

            <div class="columns">

                <div class="column is-4">

                    <label-value label="route type"  v-if="document.route_types">
                        {{document.route_types.join(', ')}}
                    </label-value>

                    <label-value label="activities">
                        <activities :activities="document.activities"/>
                    </label-value>

                    <field-view :document="document" :field="fields.durations"/>

                    <field-view :document="document" :field="fields.rock_types" />
                    <field-view :document="document" :field="fields.configuration" />


                    <field-view :document="document" :field="fields.slackline_type"/>

                </div>
                <div class="column is-4">

                    <label-value label="ratings">
                        <route-rating :route="document"/>
                    </label-value>

                    <field-view :document="document" :field="fields.glacier_gear"/>

                    <label-value label="orientation"  v-if="document.orientations">
                        {{document.orientations.join(', ')}}
                    </label-value>

                    <field-view :document="document" :field="fields.lift_access"/>


                </div>
                <div class="column is-4">

                    <div v-if="document.elevation_min || document.elevation_max">
                        <label>
                            <span>elevation&nbsp;</span>
                            <span v-if="document.elevation_min">min</span><span v-if="document.elevation_min && document.elevation_max">/</span><span v-if="document.elevation_max">max</span>
                        </label>
                        :
                        <span v-if="document.elevation_min">{{document.elevation_min}}&#8239;m</span>
                        <span v-if="document.elevation_min && document.elevation_max">/</span>
                        <span v-if="document.elevation_max">{{document.elevation_max}}&#8239;m</span>
                    </div>

                    <label-value label="height difference"  v-if="document.height_diff_up || document.height_diff_down">
                        <span v-if="document.height_diff_up">+{{document.height_diff_up}}&#8239;m</span>
                        <span v-if="document.height_diff_up && document.height_diff_down">/</span>
                        <span v-if="document.height_diff_down">-{{document.height_diff_down}}&#8239;m</span>
                    </label-value>

                    <field-view :document="document" :field="fields.height_diff_difficulties"/>
                    <field-view :document="document" :field="fields.difficulties_height"/>



                    <field-view :document="document" :field="fields.route_length"/>
                    <field-view :document="document" :field="fields.mtb_height_diff_portages"/>
                    <field-view :document="document" :field="fields.mtb_length_asphalt"/>
                    <field-view :document="document" :field="fields.mtb_length_trail"/>



                    <label-value label="slope" v-if="locale.slope">
                        {{locale.slope}}
                    </label-value>

                    <field-view :document="document" :field="fields.slackline_height"/>

                </div>

            </div>

            <markdown-section :document="document" :locale="locale" :field="fields.summary"/>
            <markdown-section :document="document" :locale="locale" :field="fields.route_history" />
            <markdown-section :document="document" :locale="locale" :field="fields.description" />
            <markdown-section :document="document" :locale="locale" :field="fields.slackline_anchor1" />
            <markdown-section :document="document" :locale="locale" :field="fields.slackline_anchor2" />
            <markdown-section :document="document" :locale="locale" :field="fields.remarks" />
            <markdown-section :document="document" :locale="locale" :field="fields.gear" />
            <markdown-section :document="document" :locale="locale" :field="fields.external_resources" />

            <div class="hidden-print" v-if="document.associations.recent_outings.documents.length!=0">
                <h2>
                    <span>Recent outings</span>
                </h2>
                <pretty-outing-link
                   v-for="outing of document.associations.recent_outings.documents" :key="outing.document_id"
                   :outing="outing"/>
            </div>

            <div class="columns hidden-print"  v-if="document.associations">
                <div class="column"  v-if="document.associations.articles.length!=0">
                    <h2>Articles</h2>
                    <div v-for="article of document.associations.articles" :key="article.document_id">
                        <document-link :document="article"/>
                    </div>
                </div>
                <div class="column"  v-if="document.associations.books.length!=0">
                    <h2>Books</h2>
                    <div v-for="book of document.associations.books" :key="book.document_id">
                        <document-link :document="book">
                            <i>
                                <document-title :document="book"/>
                            </i>, {{book.author}}
                        </document-link>
                    </div>
                </div>
            </div>

            <document-comments :document="document" :locale="locale" />

        </div>

    </div>
</template>

<script>

    import AreasLinks from './utils/AreasLinks'

    import MarkdownSection from './utils/MarkdownSection'
    import LabelValue from './utils/LabelValue'
    import FieldView from './utils/FieldView'

    import DocumentComments from './utils/DocumentComments'

    export default {

        components: {
            AreasLinks,
            MarkdownSection,
            LabelValue,
            FieldView,

            DocumentComments,
        },

        props:["document", "locale", "fields"],
    }
</script>
