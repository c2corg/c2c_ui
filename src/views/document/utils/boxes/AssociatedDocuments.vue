<template>
  <div>
    <div v-for="(waypointsList, i) of waypointsLists" :key="i" class="associations-list">
      <div class="title">
        {{ waypointsList.title | uppercaseFirstLetter }}
      </div>
      <document-link
        v-for="waypoint of waypointsList.waypoints"
        :key="waypoint.document_id"
        :document="waypoint"
        class="columns is-mobile has-hover-background is-marginless is-vcentered"
      >
        <div class="column is-narrow is-paddingless">
          <icon-waypoint-type :waypoint-type="waypoint.waypoint_type" fixed-width class="icon-link" />
        </div>
        <div class="column is-paddingless">
          <document-title :document="waypoint" />
          <marker-soft-mobility v-if="$documentUtils.hasSoftMobility(waypoint)" class="icon-link" />
        </div>
        <div class="column is-narrow has-text-grey is-paddingless is-size-7">{{ waypoint.elevation }}&nbsp;m</div>
      </document-link>
      <hr />
    </div>

    <!-- books -->
    <div v-if="associations.books.length != 0" class="associations-list">
      <div class="title">
        {{ $gettext('books') | uppercaseFirstLetter }}
      </div>
      <div v-for="book of associations.books" :key="book.document_id" class="is-ellipsed">
        <document-link :document="book">
          <icon-book fixed-width class="icon-link" />
          <document-title :document="book" />
        </document-link>
      </div>
      <hr />
    </div>

    <!-- articles -->
    <div v-if="associations.articles.length != 0" class="associations-list">
      <div class="title">
        {{ $gettext('articles') | uppercaseFirstLetter }}
      </div>
      <div v-for="article of associations.articles" :key="article.document_id" class="is-ellipsed">
        <document-link :document="article">
          <icon-article fixed-width class="icon-link" />
          <document-title :document="article" />
        </document-link>
      </div>
      <hr />
    </div>

    <!-- xreports -->
    <div v-if="associations.xreports && associations.xreports.length != 0" class="associations-list">
      <div class="title">
        {{ $gettext('xreports') | uppercaseFirstLetter }}
      </div>
      <div v-for="xreport of associations.xreports" :key="xreport.document_id" class="is-ellipsed">
        <document-link :document="xreport">
          <icon-xreport fixed-width class="icon-link" />
          <document-title :document="xreport" />
        </document-link>
      </div>
      <hr />
    </div>

    <!-- outings -->
    <div
      v-if="documentType === 'xreport' && associations.outings && associations.outings.length != 0"
      class="associations-list"
    >
      <div class="title">
        {{ $gettext('outings') | uppercaseFirstLetter }}
      </div>
      <div v-for="outing of associations.outings" :key="outing.document_id" class="is-ellipsed">
        <document-link :document="outing">
          <icon-outing fixed-width class="icon-link" />
          <document-title :document="outing" uppercase-first-letter />
        </document-link>
      </div>
      <hr />
    </div>
  </div>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],

  computed: {
    associations() {
      return this.document.associations ?? {};
    },

    waypointsLists() {
      const result = [];

      const push = function (title, waypoints) {
        if (waypoints && waypoints.length !== 0) {
          result.push({ title, waypoints });
        }
      };

      push(this.$gettext('waypoints'), this.associations.waypoints);
      push(this.$gettext('waypoint_children'), this.associations.waypoint_children);

      return result;
    },
  },

  created() {
    function compare(left, right) {
      return left.document_id < right.document_id;
    }

    this.associations.books = (this.associations.books ?? []).sort(compare);
    this.associations.articles = this.associations.articles ?? [];
  },
};
</script>

<style scoped lang="scss">
.title {
  margin-bottom: 0.2rem !important;
}

.associations-list:not(:last-child) {
  margin-bottom: 1rem;
}

.icon-link,
.icon-link:hover {
  color: $dark;
  margin-right: 3px;
}
</style>
