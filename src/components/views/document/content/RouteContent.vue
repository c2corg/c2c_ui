<template>

    <div class="columns">
        <div class="column is-8">
            <!--   CONTENT  -->

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

        <div class="column is-4">
            <areas-links :areas="document.areas"/>
            <label-value label="Credits">
                <document-license :document="document" cc="by-sa"/>
            </label-value>

            <label-value label="activities">
                <activities :activities="document.activities"/>
            </label-value>

            <label-value label="ratings">
                <route-rating :route="document"/>
            </label-value>

            <field-view :document="document" :field="fields.slackline_type"/>
            <field-view :document="document" :field="fields.height_diff_difficulties"/>

            <label-value label="route type"  v-if="document.route_types">
                {{document.route_types.join(', ')}}
            </label-value>

            <field-view :document="document" :field="fields.glacier_gear"/>

            <label-value label="configuration"  v-if="document.configuration">
                {{document.configuration.join(', ')}}
            </label-value>

            <label-value label="orientation"  v-if="document.orientations">
                {{document.orientations.join(', ')}}
            </label-value>

            <label-value label="height difference"  v-if="document.height_diff_up || document.height_diff_down">
                <span v-if="document.height_diff_up">+{{document.height_diff_up}}&#8239;m</span>
                <span v-if="document.height_diff_up && document.height_diff_down">/</span>
                <span v-if="document.height_diff_down">-{{document.height_diff_down}}&#8239;m</span>
            </label-value>

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

            <field-view :document="document" :field="fields.route_length"/>
            <field-view :document="document" :field="fields.slackline_height"/>

            <div v-if="document.associations">
                <strong>Waypoints</strong>
                <div v-for="waypoint of document.associations.waypoints"
                     :key="waypoint.document_id">
                    <document-link :document="waypoint"/>
                </div>
            </div>


           <map-view :documents="{documents:[document]}" style="width: 100%; height: 200px">
           </map-view>

        </div>
    </div>
</template>

<script>

    import AreasLinks from '@/components/views/document/utils/AreasLinks'

    import MarkdownSection from './utils/MarkdownSection'
    import LabelValue from './utils/LabelValue'
    import FieldView from './utils/FieldView'

    export default {

        components: {
            AreasLinks,
            MarkdownSection,
            LabelValue,
            FieldView,
        },

        props:["document", "locale", "fields"],
    }
</script>
