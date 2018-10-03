<template>
    <document-view-container
        v-if="document"
        :document="document"
        :locale="locale"

        :version="version"
        :previous-version-id="previousVersionId"
        :next-version-id="nextVersionId">

        <div>
            <div class="columns">

                <div class="column is-3">
                    <map-box :document="document" />

                    <associated-documents :document="document" />

                    <lang-switcher-box :document="document"/>

                    <license-box cc="by-sa"/>
                </div>

                <div class="column">
                    <content-box>
                        <div class="columns is-multiline">
                            <div class="column is-4">

                                <field-view :document="document" :field="fields.waypoint_type"/>
                                <field-view :document="document" :field="fields.rock_types"/>

                                <field-view :document="document" :field="fields.height_median"/>
                                <label-value v-if="document.height_max || document.height_min" label="height">
                                    <span v-if="document.height_min">{{ document.height_min }}&nbsp;m</span>
                                    <span v-if="document.height_min && document.height_max">/</span>
                                    <span v-if="document.height_max">{{ document.height_max }}&nbsp;m</span>
                                </label-value>

                                <field-view :document="document" :field="fields.climbing_outdoor_types"/>
                                <field-view :document="document" :field="fields.climbing_styles"/>

                                <field-view :document="document" :field="fields.climbing_rating_median"/>
                                <label-value v-if="document.climbing_rating_min || document.climbing_rating_max" label="climbing rating">
                                    <span v-if="document.climbing_rating_min">{{ document.climbing_rating_min }}</span>
                                    <span v-if="document.climbing_rating_min && document.climbing_rating_max">/</span>
                                    <span v-if="document.climbing_rating_max">{{ document.climbing_rating_max }}</span>
                                </label-value>

                                <field-view :document="document" :field="fields.capacity"/>
                                <field-view :document="document" :field="fields.capacity_staffed"/>
                            </div>

                            <div class="column is-4">
                                <field-view :document="document" :field="fields.best_periods"/>
                                <field-view :document="document" :field="fields.routes_quantity"/>
                                <field-view :document="document" :field="fields.access_time"/>

                                <field-view :document="document" :field="fields.url"/>
                                <field-view :document="document" :field="fields.phone"/>
                                <field-view :document="document" :field="fields.custodianship"/>

                                <field-view :document="document" :field="fields.parking_fee"/>
                                <field-view :document="document" :field="fields.snow_clearance_rating"/>
                                <input-orientation v-if="document.orientations && document.orientations.length" v-model="document.orientations" read-only/>

                            </div>

                            <div class="column is-4">

                                <field-view :document="document" :field="fields.elevation"/>
                                <field-view :document="document" :field="fields.elevation_min"/>

                                <field-view :document="document" :field="fields.public_transportation_rating"/>
                                <field-view :document="document" :field="fields.public_transportation_types"/>

                                <field-view :document="document" :field="fields.equipment_ratings"/>
                                <field-view :document="document" :field="fields.rain_proof"/>
                                <field-view :document="document" :field="fields.children_proof"/>


                                <field-view :document="document" :field="fields.matress_unstaffed"/>
                                <field-view :document="document" :field="fields.blanket_unstaffed"/>
                                <field-view :document="document" :field="fields.heating_unstaffed"/>
                                <field-view :document="document" :field="fields.gas_unstaffed"/>

                            </div>
                        </div>
                    </content-box>

                    <content-box v-if="locale.description || locale.access">
                        <markdown-section :document="document" :locale="locale" :field="fields.description" />
                        <markdown-section :document="document" :locale="locale" :field="fields.access" />
                    </content-box>

                    <content-box v-if="document.associations.all_routes.documents.length">
                        <h2 class="title is-2" v-translate>Routes</h2>

                        <div v-for="route of document.associations.all_routes.documents" :key="route.document_id">
                            <pretty-route-link :route="route"/>
                        </div>
                        
                    </content-box>

                    <recent-outings-box :document="document"/>

                    <content-box v-if="document.associations.waypoint_children.length">
                        <h2 class="title is-2" v-translate>
                            Waypoints children
                        </h2>
                        <div v-for="child of document.associations.waypoint_children" :key="child.document_id">
                            <document-link :document="child"/>
                        </div>
                    </content-box>

                    <content-box v-if="document.associations.images.length">
                        <gallery :images="document.associations.images"/>
                    </content-box>

                    <comments-box :document="document" :locale="locale" />
                </div>
            </div>
        </div>
    </document-view-container>
</template>

<script>
    import mixins from "./utils/mixins.js"

    export default {
        mixins : [
            mixins,
        ],
    }
</script>
