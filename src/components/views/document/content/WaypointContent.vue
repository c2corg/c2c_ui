<template>
    <!-- CONTENT  -->

    <div>
        <div class="columns is-multiline">

            <div class="column is-8">
                <areas-links :areas="document.areas"/>
            </div>
            <div class="column is-4">
                <label>Credits</label>
                <document-license :document="document" cc="by-sa"/>
            </div>

            <div class="column is-4">

                <div v-if="document.waypoint_type">
                    <label>waypoint_type</label>
                    {{document.waypoint_type}}
                </div>

                <div v-if="document.elevation">
                    <label>elevation</label>
                    {{document.elevation}}&nbsp;m
                </div>

                <div v-if="document.height_max || document.height_min">
                    <label>height</label>
                    <span v-if="document.height_min">{{document.height_min}}&nbsp;m</span>
                    <span v-if="document.height_min && document.height_max">/</span>
                    <span v-if="document.height_max">{{document.height_max}}&nbsp;m</span>
                </div>

                <div v-if="document.height_median">
                    <label>height_median</label>
                    {{document.height_median}}&nbsp;m
                </div>

                <div v-if="document.climbing_outdoor_types">
                    <label>climbing_outdoor_types</label>
                    {{document.climbing_outdoor_types.join(', ')}}
                </div>

                <div v-if="document.climbing_styles">
                    <label>climbing_styles</label>
                    {{document.climbing_styles.join(', ')}}
                </div>
                <div v-if="document.climbing_rating_min || document.climbing_rating_max">
                    <label>climbing_rating</label>
                    <span v-if="document.climbing_rating_min">{{document.climbing_rating_min}}</span>
                    <span v-if="document.climbing_rating_min && document.climbing_rating_max">/</span>
                    <span v-if="document.climbing_rating_max">{{document.climbing_rating_max}}</span>
                </div>
                <div v-if="document.climbing_rating_median">
                    <label>climbing_rating_median</label>
                    {{document.climbing_rating_median}}
                </div>

            </div>
            <div class="col-sm-4">
                <div v-if="document.orientations && document.orientations.length != 0">
                    <label>orientations</label>
                    {{document.orientations.join(', ')}}
                </div>
                <div v-if="document.best_periods && document.best_periods.length != 0">
                    <label>best_periods</label>
                    {{translateArray(document.best_periods).join(', ')}}
                </div>
                <div v-if="document.routes_quantity">
                    <label>routes_quantity</label>
                    {{document.routes_quantity}}
                </div>
                <div v-if="document.access_time">
                    <label>access_time</label>
                    {{document.access_time}}
                </div>

            </div>
            <div class="col-sm-4">
                <div v-if="document.protected">
                    <label>protected</label>
                    {{document.protected}}
                </div>

                <div v-if="document.equipment_ratings && document.equipment_ratings.length!=0">
                    <label>equipment_ratings</label>
                    {{document.equipment_ratings.join(", ")}}
                </div>

                <div v-if="document.rock_types">
                    <label>rock_types</label>
                    {{document.rock_types.join(", ")}}
                </div>
                <div v-if="document.rain_proof">
                    <label>rain_proof</label>
                    {{document.rain_proof}}
                </div>
                <div v-if="document.children_proof">
                    <label>children_proof</label>
                    {{document.children_proof}}
                </div>

            </div>

            <div class="column is-12">
                <markdown-section :document="document" :locale="locale" :field="fields.description" />
                <markdown-section :document="document" :locale="locale" :field="fields.access" />
            </div>

            <div class="column is-6" v-if="document.associations.all_routes.documents.length">

                <h2>Routes</h2>

                <pretty-route-link
                   v-for="(route, index) of document.associations.all_routes.documents"
                   :route="route"
                   :key="index"/>
            </div>

            <div class="column is-6">
                <h2  v-if="document.associations.recent_outings.documents.length">
                    Recent outings
                </h2>
                <pretty-outing-link v-for="(outing, index) of document.associations.recent_outings.documents"
                             :outing="outing"
                             :key="index"/>

                <h2 v-if="document.associations.waypoint_children.length">
                    Waypoints
                </h2>
                <div v-for="child of document.associations.waypoint_children"
                     :key="child.document_id">
                    <document-link :document="child"/>
                </div>

            </div>

            <div class="column is-12" v-if="document.associations.images.length">
                <gallery :images="document.associations.images"/>
            </div>
        </div>
    </div>
</template>


<script>
    import MarkdownSection from './utils/MarkdownSection'
    import AreasLinks from '@/components/views/document/utils/AreasLinks'

    export default {

        components: {
            MarkdownSection,
            AreasLinks,
        },

        props:["document", "locale", "fields"],
    }
</script>
