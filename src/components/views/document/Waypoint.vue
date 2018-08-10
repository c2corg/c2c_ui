<template>
    <div v-if="waypoint" class="section content">
        <h1>
            <i class="fas fa-map-pin"/>
            <document-title :document="waypoint"/>
        </h1>

        <!-- ---------------- CONTENT -------------------------------- -->

        <div>
            <div class="columns is-multiline">

                <div class="column is-8">
                    <areas-links :areas="waypoint.areas"/>
                </div>
                <div class="column is-4">
                    <label>Credits</label>
                    <document-license :document="waypoint" cc="by-sa"/>
                </div>

                <div class="column is-4">

                    <div v-if="waypoint.waypoint_type">
                        <label>waypoint_type</label>
                        {{waypoint.waypoint_type}}
                    </div>

                    <div v-if="waypoint.elevation">
                        <label>elevation</label>
                        {{waypoint.elevation}}&nbsp;m
                    </div>

                    <div v-if="waypoint.height_max || waypoint.height_min">
                        <label>height</label>
                        <span v-if="waypoint.height_min">{{waypoint.height_min}}&nbsp;m</span>
                        <span v-if="waypoint.height_min && waypoint.height_max">/</span>
                        <span v-if="waypoint.height_max">{{waypoint.height_max}}&nbsp;m</span>
                    </div>

                    <div v-if="waypoint.height_median">
                        <label>height_median</label>
                        {{waypoint.height_median}}&nbsp;m
                    </div>

                    <div v-if="waypoint.climbing_outdoor_types">
                        <label>climbing_outdoor_types</label>
                        {{waypoint.climbing_outdoor_types.join(', ')}}
                    </div>

                    <div v-if="waypoint.climbing_styles">
                        <label>climbing_styles</label>
                        {{waypoint.climbing_styles.join(', ')}}
                    </div>
                    <div v-if="waypoint.climbing_rating_min || waypoint.climbing_rating_max">
                        <label>climbing_rating</label>
                        <span v-if="waypoint.climbing_rating_min">{{waypoint.climbing_rating_min}}</span>
                        <span v-if="waypoint.climbing_rating_min && waypoint.climbing_rating_max">/</span>
                        <span v-if="waypoint.climbing_rating_max">{{waypoint.climbing_rating_max}}</span>
                    </div>
                    <div v-if="waypoint.climbing_rating_median">
                        <label>climbing_rating_median</label>
                        {{waypoint.climbing_rating_median}}
                    </div>

                </div>
                <div class="col-sm-4">
                    <div v-if="waypoint.orientations && waypoint.orientations.length != 0">
                        <label>orientations</label>
                        {{waypoint.orientations.join(', ')}}
                    </div>
                    <div v-if="waypoint.best_periods && waypoint.best_periods.length != 0">
                        <label>best_periods</label>
                        {{translateArray(waypoint.best_periods).join(', ')}}
                    </div>
                    <div v-if="waypoint.routes_quantity">
                        <label>routes_quantity</label>
                        {{waypoint.routes_quantity}}
                    </div>
                    <div v-if="waypoint.access_time">
                        <label>access_time</label>
                        {{waypoint.access_time}}
                    </div>

                </div>
                <div class="col-sm-4">
                    <div v-if="waypoint.protected">
                        <label>protected</label>
                        {{waypoint.protected}}
                    </div>

                    <div v-if="waypoint.equipment_ratings && waypoint.equipment_ratings.length!=0">
                        <label>equipment_ratings</label>
                        {{waypoint.equipment_ratings.join(", ")}}
                    </div>

                    <div v-if="waypoint.rock_types">
                        <label>rock_types</label>
                        {{waypoint.rock_types.join(", ")}}
                    </div>
                    <div v-if="waypoint.rain_proof">
                        <label>rain_proof</label>
                        {{waypoint.rain_proof}}
                    </div>
                    <div v-if="waypoint.children_proof">
                        <label>children_proof</label>
                        {{waypoint.children_proof}}
                    </div>

                </div>

                <div class="column is-12">
                    <markdown-section :markdown="waypoint.locales[0].description" title="Description"/>
                    <markdown-section :markdown="waypoint.locales[0].access" title="Access"/>
                </div>

                <div class="column is-6" v-if="waypoint.associations.all_routes.documents.length">

                    <h2>Routes</h2>

                    <route-link
                       v-for="(route, index) of waypoint.associations.all_routes.documents"
                       :route="route"
                       :key="index"/>
                </div>

                <div class="column is-6">
                    <h2  v-if="waypoint.associations.recent_outings.documents.length">
                        Recent outings
                    </h2>
                    <outing-link v-for="(outing, index) of waypoint.associations.recent_outings.documents"
                                 :outing="outing"
                                 :key="index"/>

                    <h2 v-if="waypoint.associations.waypoint_children.length">
                        Waypoints
                    </h2>
                    <div v-for="waypoint of waypoint.associations.waypoint_children"
                         :key="waypoint.document_id">
                        <document-link :document="waypoint"/>
                    </div>

                </div>

                <div class="column is-12" v-if="waypoint.associations.images.length">
                    <gallery :images="waypoint.associations.images"/>
                </div>
            </div>
        </div>
    </div>


</template>


<script>
    import MarkdownSection from '@/components/utils/MarkdownSection'
    import DocumentTitle from '@/components/utils/DocumentTitle'
    import OutingLink from '@/components/views/document/utils/OutingLink'
    import RouteLink from '@/components/views/document/utils/RouteLink'
    import DocumentLink from '@/components/utils/DocumentLink'
    import DocumentLicense from '@/components/utils/DocumentLicense'
    import Gallery from '@/components/utils/Gallery'
    import AreasLinks from '@/components/views/document/utils/AreasLinks'
    import Activities from '@/components/utils/Activities'
    import RouteRating from '@/components/utils/RouteRating'

    import c2c from '@/js/c2c.js'

    export default {

        components: {
            Activities,
            MarkdownSection,
            DocumentTitle,
            DocumentLink,
            OutingLink,
            RouteLink,
            DocumentLicense,
            Gallery,
            AreasLinks,
            RouteRating
        },

        data() {
            return {
                waypoint: null,
            }
        },

        created() {
            c2c.waypoint.get(this.$route.params.id).then(response => {this.waypoint=response.data});
        }

    }
</script>
