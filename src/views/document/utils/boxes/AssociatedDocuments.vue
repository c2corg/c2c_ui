<template>
  <div>
    <div v-if="associations.waypoints.length" class="associations-list">
      <div class="title">
        {{ $gettext('waypoints') | uppercaseFirstLetter }}
      </div>
      <div v-for="waypoint of associations.waypoints" :key="waypoint.document_id" class="is-ellipsed">
        <pretty-waypoint-link :waypoint="waypoint"/>
      </div>
      <hr>
    </div>

    <div v-if="associations.waypoint_children && associations.waypoint_children.length" class="associations-list">
      <div class="title">
        {{ $gettext('waypoint_children') | uppercaseFirstLetter }}
      </div>
      <div v-for="waypoint of associations.waypoint_children" :key="waypoint.document_id" class="is-ellipsed">
        <pretty-waypoint-link :waypoint="waypoint"/>
      </div>
      <hr>
    </div>

    <!-- books -->
    <div v-if="associations.books.length!=0" class="associations-list">
      <div class="title">
        {{ $gettext('books') | uppercaseFirstLetter }}
      </div>
      <div v-for="book of associations.books" :key="book.document_id" class="is-ellipsed">
        <document-link :document="book">
          <icon-book class="icon-link"/>&nbsp;<document-title :document="book" />
        </document-link>
      </div>
      <hr>
    </div>

    <!-- articles -->
    <div v-if="associations.articles.length!=0" class="associations-list">
      <div class="title">
        {{ $gettext('articles') | uppercaseFirstLetter }}
      </div>
      <div v-for="article of associations.articles" :key="article.document_id" class="is-ellipsed">
        <document-link :document="article">
          <icon-article class="icon-link"/>&nbsp;<document-title :document="article" />
        </document-link>
      </div>
      <hr>
    </div>

    <!-- maps -->
    <div v-if="document.maps || document.maps_info" class="associations-list">
      <div class="title">
        {{ $gettext('maps') | uppercaseFirstLetter }}
      </div>
      <div v-if="document.maps_info">
        <icon-map />
        <span>
          {{ document.maps_info }}
        </span>
      </div>
      <div v-for="map of document.maps" :key="map.document_id" class="is-ellipsed">
        <icon-map />
        <document-link :document="map">
          {{ map.editor }} - {{ map.code }} - <document-title :document="map" />
        </document-link>
      </div>
      <hr>
    </div>
  </div>
</template>

<script>
  import { requireDocumentProperty } from '@/js/properties-mixins';

  export default {
    mixins: [ requireDocumentProperty ],

    data() {
      return {
        associations: null
      };
    },

    created() {
      function compare(left, right) {
        return left.document_id < right.document_id;
      }

      this.associations = this.document.associations || {};

      this.associations.books = (this.associations.books || []).sort(compare);
      this.associations.waypoints = this.associations.waypoints || [];
      this.associations.articles = this.associations.articles || [];
    }
  };
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
