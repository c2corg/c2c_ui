<template>
  <div>
    <html-header :title="$gettext('Topoguide')" />
    <div class="topoguide">
      <h1 class="has-text-centered has-text-weight-semibold" v-translate>Topoguide</h1>
      <div class="links is-flex">
        <topoguide-view-link to="outings" :label="$gettext('outings')" icon="icon-outing" />
        <topoguide-view-link to="routes" :label="$gettext('routes')" icon="icon-route" />
        <topoguide-view-link to="waypoints" :label="$gettext('waypoints')" icon="icon-waypoint" />
        <topoguide-view-link to="images" :label="$gettext('images')" icon="icon-image" />
        <topoguide-view-link to="books" :label="$gettext('books')" icon="icon-book" />
        <topoguide-view-link to="articles" :label="$gettext('articles')" icon="icon-article" />
        <topoguide-view-link to="areas" :label="$gettext('areas')" icon="icon-area" />
        <topoguide-view-link to="yeti" label="YETI" icon="icon-yeti" />
        <topoguide-view-link to="sophie-picture-contest" label="CPS" icon="icon-star" />
      </div>
    </div>
    <div class="section columns is-multiline is-variable is-8">
      <div class="column is-6">
        <h2 class="title is-2 has-text-centered has-background-secondary has-text-light has-rounded-corner">
          {{ $gettext('outings') | uppercaseFirstLetter }}
        </h2>
        <div class="columns is-multiline is-variable is-mobile is-1">
          <topoguide-view-small-link
            class="column is-4-mobile is-3-tablet is-3-desktop is-3-widescreen is-3-fullhd"
            v-for="activity of activities"
            :key="activity"
            :to="{ name: 'outings', query: { act: activity } }"
          >
            <span class="is-size-1"><icon-activity :activity="activity" /></span>
            <span class="has-text-weight-semibold">
              {{ $gettext(activity, 'activities') | uppercaseFirstLetter }}
            </span>
          </topoguide-view-small-link>

          <topoguide-view-small-link
            class="column is-4-mobile is-3-tablet is-3-desktop is-3-widescreen is-3-fullhd"
            :to="{ name: 'outing-add', params: { lang: $language.current } }"
          >
            <span class="has-text-success is-size-1"><fa-icon icon="plus" /></span>
            <span class="has-text-success has-text-weight-semibold" v-translate>New outing</span>
          </topoguide-view-small-link>
        </div>
      </div>
      <div class="column is-6">
        <h2 class="title is-2 has-text-centered has-background-secondary has-text-light has-rounded-corner">
          {{ $gettext('routes') | uppercaseFirstLetter }}
        </h2>
        <div class="columns is-multiline is-variable is-mobile is-1">
          <topoguide-view-small-link
            class="column is-4-mobile is-3-tablet is-3-desktop is-3-widescreen is-3-fullhd"
            v-for="activity of activities"
            :key="activity"
            :to="{ name: 'routes', query: { act: activity } }"
          >
            <span class="is-size-1"><icon-activity :activity="activity" /></span>
            <span class="has-text-weight-semibold">
              {{ $gettext(activity, 'activities') | uppercaseFirstLetter }}
            </span>
          </topoguide-view-small-link>

          <topoguide-view-small-link
            class="column is-4-mobile is-3-tablet is-3-desktop is-3-widescreen is-3-fullhd"
            :to="{ name: 'route-add', params: { lang: $language.current } }"
          >
            <span class="has-text-success is-size-1"><fa-icon icon="plus" /></span>
            <span class="has-text-success has-text-weight-semibold" v-translate>New route</span>
          </topoguide-view-small-link>
        </div>
      </div>
      <div class="column is-12">
        <h2 class="title is-2 has-text-centered has-background-secondary has-text-light has-rounded-corner">
          {{ $gettext('waypoints') | uppercaseFirstLetter }}
        </h2>
        <div class="columns is-multiline is-variable is-mobile is-1">
          <topoguide-view-small-link
            class="column is-4-mobile is-2-tablet is-2-desktop is-2-widescreen is-2-fullhd"
            v-for="waypoint_type of waypoint_types"
            :key="waypoint_type"
            :to="{ name: 'waypoints', query: { wtyp: waypoint_type } }"
          >
            <span class="is-size-1"><icon-waypoint-type :waypoint-type="waypoint_type" /></span>
            <span class="has-text-weight-semibold">
              {{ $gettext(waypoint_type, 'waypoint_types') | uppercaseFirstLetter }}
            </span>
          </topoguide-view-small-link>

          <topoguide-view-small-link
            class="column is-4-mobile is-2-tablet is-2-desktop is-2-widescreen is-2-fullhd"
            :to="{ name: 'waypoint-add', params: { lang: $language.current } }"
          >
            <span class="has-text-success is-size-1"><fa-icon icon="plus" /></span>
            <span class="has-text-success has-text-weight-semibold" v-translate>New waypoint</span>
          </topoguide-view-small-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TopoguideViewLink from './TopoguideViewLink';
import TopoguideViewSmallLink from './TopoguideViewSmallLink';

import constants from '@/js/constants';

export default {
  components: {
    TopoguideViewLink,
    TopoguideViewSmallLink,
  },

  computed: {
    activities() {
      return constants.activities;
    },
    waypoint_types() {
      return constants.waypoint_types;
    },
  },
};
</script>

<style scoped lang="scss">
.topoguide {
  background-image: url('~@/assets/img/backgrounds/laurentf-sajama-800w.jpg');
  background-position-x: center;
  background-size: cover;
  padding-top: 90px; //keep the header on a deep color zone
  padding-bottom: 25px;
  justify-content: center;
  // 1224px because after 1024px breakpoint, we have an additional 200px wide menu on the left
  @media (min-width: 800px) and (max-width: 1224px) {
    background-image: url('~@/assets/img/backgrounds/laurentf-sajama-1024w.jpg');
  }
  @media (min-width: 1224px) {
    background-image: url('~@/assets/img/backgrounds/laurentf-sajama-1200w.jpg');
  }

  h1 {
    font-size: 3rem;
    color: $light;
    margin-bottom: 25px;
  }

  .links {
    justify-content: center;
    flex-flow: wrap row;
    max-width: 700px;
    margin: auto;
  }
}

.title {
  line-height: 1.5 !important;
}
</style>
