<template>
    <content-box>

        <div v-if="document.associations && document.associations.waypoints.length" class="associations-list">
            <div class="title" v-translate>Waypoints</div>
            <div v-for="waypoint of document.associations.waypoints" :key="waypoint.document_id" class="is-ellipsed">
                <pretty-waypoint-link :waypoint="waypoint"/>
            </div>
        </div>

        <!-- books -->
        <div v-if="document.associations && document.associations.books.length!=0" class="associations-list">
            <div class="title" v-translate>Books</div>
            <div v-for="book of document.associations.books" :key="book.document_id" class="is-ellipsed">
                <icon-book />
                <document-link :document="book"/>
            </div>
        </div>

        <!-- articles -->
        <div v-if="document.associations && document.associations.articles.length!=0" class="associations-list">
            <div class="title" v-translate>Articles</div>
            <div v-for="article of document.associations.articles" :key="article.document_id" class="is-ellipsed">
                <icon-article />
                <document-link :document="article"/>
            </div>
        </div>

        <!-- maps -->
        <div v-if="document.maps && document.maps.length" class="associations-list">
            <div class="title" v-translate>Maps</div>
            <div v-for="map of document.maps" :key="map.document_id" class="is-ellipsed">
                <icon-map />
                <document-link :document="map"/>
            </div>
        </div>

    </content-box>
</template>

<script>
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [ requireDocumentProperty ],
    }
</script>

<style scoped>

.title{
    margin-bottom:0.2rem !important;
}

.associations-list:not(:last-child){
    margin-bottom: 1rem;
}

</style>
