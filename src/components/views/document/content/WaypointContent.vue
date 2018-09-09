<template>
    <!-- CONTENT  -->

    <div>
        <div class="columns">

            <div class="column is-3">
                <areas-links :areas="document.areas"/>
                <map-view :document="document" />

                <ul>
                    <li v-for="waypoint of document.associations.waypoints" :key="waypoint.document_id">
                        <document-link :document="waypoint">
                            <document-title :document="waypoint"/>
                            {{waypoint.elevation}}&nbsp;m
                        </document-link>
                    </li>
                </ul>

                <ul>
                    <li v-for="map of document.maps" :key="map.document_id">
                        <document-link :document="map"/>
                    </li>
                </ul>

                <ul>
                    <li v-for="book of document.associations.books" :key="book.document_id">
                        <document-link :document="book"/>
                    </li>
                </ul>

                <ul>
                    <li v-for="article of document.associations.articles" :key="article.document_id">
                        <document-link :document="article"/>
                    </li>
                </ul>

                <document-license :document="document" cc="by-sa"/>
            </div>

            <div class="column">
                <div class="columns is-multiline">
                    <div class="column is-4">

                        <field-view :document="document" :field="fields.waypoint_type"/>

                        <label-value v-if="document.height_max || document.height_min" label="height">
                            <span v-if="document.height_min">{{document.height_min}}&nbsp;m</span>
                            <span v-if="document.height_min && document.height_max">/</span>
                            <span v-if="document.height_max">{{document.height_max}}&nbsp;m</span>
                        </label-value>

                        <field-view :document="document" :field="fields.height_median"/>
                        <field-view :document="document" :field="fields.climbing_outdoor_types"/>
                        <field-view :document="document" :field="fields.climbing_styles"/>

                        <label-value v-if="document.climbing_rating_min || document.climbing_rating_max" label="climbing_rating">
                            <span v-if="document.climbing_rating_min">{{document.climbing_rating_min}}</span>
                            <span v-if="document.climbing_rating_min && document.climbing_rating_max">/</span>
                            <span v-if="document.climbing_rating_max">{{document.climbing_rating_max}}</span>
                        </label-value>

                        <field-view :document="document" :field="fields.climbing_rating_median"/>

                        <field-view :document="document" :field="fields.capacity"/>
                        <field-view :document="document" :field="fields.capacity_staffed"/>


                    </div>

                    <div class="column is-4">
                        <field-view :document="document" :field="fields.orientations"/>
                        <field-view :document="document" :field="fields.best_periods"/>
                        <field-view :document="document" :field="fields.routes_quantity"/>
                        <field-view :document="document" :field="fields.access_time"/>

                        <field-view :document="document" :field="fields.url"/>
                        <field-view :document="document" :field="fields.phone"/>
                        <field-view :document="document" :field="fields.custodianship"/>

                        <field-view :document="document" :field="fields.parking_fee"/>
                        <field-view :document="document" :field="fields.snow_clearance_rating"/>


                    </div>

                    <div class="column is-4">

                        <field-view :document="document" :field="fields.elevation"/>
                        <field-view :document="document" :field="fields.elevation_min"/>

                        <field-view :document="document" :field="fields.public_transportation_rating"/>
                        <field-view :document="document" :field="fields.public_transportation_types"/>

                        <field-view :document="document" :field="fields.protected"/>
                        <field-view :document="document" :field="fields.equipment_ratings"/>
                        <field-view :document="document" :field="fields.rock_types"/>
                        <field-view :document="document" :field="fields.rain_proof"/>
                        <field-view :document="document" :field="fields.children_proof"/>


                        <field-view :document="document" :field="fields.matress_unstaffed"/>
                        <field-view :document="document" :field="fields.blanket_unstaffed"/>
                        <field-view :document="document" :field="fields.heating_unstaffed"/>
                        <field-view :document="document" :field="fields.gas_unstaffed"/>

                    </div>

                    <div class="column is-12">
                        <markdown-section :document="document" :locale="locale" :field="fields.description" />
                        <markdown-section :document="document" :locale="locale" :field="fields.access" />
                    </div>

                    <div class="column" v-if="document.associations.all_routes.documents.length">

                        <h2>Routes</h2>

                        <pretty-route-link
                           v-for="(route, index) of document.associations.all_routes.documents" :key="index"
                           :route="route"/>
                    </div>
                    <div class="column">
                        <h2  v-if="document.associations.recent_outings.documents.length">
                            Recent outings
                        </h2>
                        <pretty-outing-link v-for="(outing, i) of document.associations.recent_outings.documents" :key="i"
                                     :outing="outing"/>

                        <h2 v-if="document.associations.waypoint_children.length">
                            Waypoints
                        </h2>
                        <div v-for="child of document.associations.waypoint_children" :key="child.document_id">
                            <document-link :document="child"/>
                        </div>

                    </div>
                </div>

                <div v-if="document.associations.images.length">
                    <gallery :images="document.associations.images"/>
                </div>

                <document-comments :document="document" :locale="locale" />
            </div>
        </div>
    </div>
</template>


<script>
    import MarkdownSection from './utils/MarkdownSection'
    import AreasLinks from './utils/AreasLinks'
    import FieldView from './utils/FieldView'
    import LabelValue from './utils/LabelValue'
    import DocumentComments from './utils/DocumentComments'

    export default {

        components: {
            MarkdownSection,
            AreasLinks,
            FieldView,
            LabelValue,
            DocumentComments,
        },

        props:["document", "locale", "fields"],
    }
</script>
