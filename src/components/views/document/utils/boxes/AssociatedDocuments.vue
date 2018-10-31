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
                <document-link :document="book">
                    <icon-book class="icon-link"/>&nbsp;<document-title :document="book" />
                </document-link>
            </div>
        </div>

        <!-- articles -->
        <div v-if="document.associations && document.associations.articles.length!=0" class="associations-list">
            <div class="title" v-translate>Articles</div>
            <div v-for="article of document.associations.articles" :key="article.document_id" class="is-ellipsed">
                <document-link :document="article">
                    <icon-article class="icon-link"/>&nbsp;<document-title :document="article" />
                </document-link>
            </div>
        </div>

        <!-- maps -->
        <div v-if="document.maps && document.maps.length" class="associations-list">
            <div class="title" v-translate>Maps</div>
            <div v-for="map of document.maps" :key="map.document_id" class="is-ellipsed">
                <icon-map />
                <document-link :document="map">
                    {{ map.editor }} - {{ map.code }} - <document-title :document="map" />
                </document-link>
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

<style scoped lang="scss">

@import "@/assets/sass/variables.scss";

.title{
    margin-bottom:0.2rem !important;
}

.associations-list:not(:last-child){
    margin-bottom: 1rem;
}

.icon-link, .icon-link:hover{
    color:$dark;
}

</style>
