<template>
  <div>
    <html-header :title="$gettext('Topoguide')" />
    <div class="topoguide">
      <!-- the browser picks the size by the width it shows it at: no breakpoint -->
      <img
        class="background-image"
        src="@/assets/img/backgrounds/laurentf-sajama-800w.jpg"
        srcset="
          @/assets/img/backgrounds/laurentf-sajama-800w.jpg   800w,
          @/assets/img/backgrounds/laurentf-sajama-1024w.jpg 1024w,
          @/assets/img/backgrounds/laurentf-sajama-1200w.jpg 1200w
        "
        sizes="100vw"
        alt=""
      />
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
          {{ $filters.uppercaseFirstLetter($gettext('outings')) }}
        </h2>
        <div class="columns is-multiline is-variable is-mobile is-1">
          <topoguide-view-small-link
            class="column is-4-mobile is-3-tablet"
            v-for="activity of activities"
            :key="activity"
            :to="{ name: 'outings', query: { act: activity } }"
          >
            <span class="is-size-1"><icon-activity :activity="activity" /></span>
            <span class="has-text-weight-semibold">
              {{ $filters.uppercaseFirstLetter($gettext(activity, 'activities')) }}
            </span>
          </topoguide-view-small-link>

          <topoguide-view-small-link
            class="column is-4-mobile is-3-tablet"
            :to="{ name: 'outing-add', params: { lang: $language.current } }"
          >
            <span class="has-text-success is-size-1"><fa-icon icon="plus" /></span>
            <span class="has-text-success has-text-weight-semibold" v-translate>New outing</span>
          </topoguide-view-small-link>
        </div>
      </div>
      <div class="column is-6">
        <h2 class="title is-2 has-text-centered has-background-secondary has-text-light has-rounded-corner">
          {{ $filters.uppercaseFirstLetter($gettext('routes')) }}
        </h2>
        <div class="columns is-multiline is-variable is-mobile is-1">
          <topoguide-view-small-link
            class="column is-4-mobile is-3-tablet"
            v-for="activity of activities"
            :key="activity"
            :to="{ name: 'routes', query: { act: activity } }"
          >
            <span class="is-size-1"><icon-activity :activity="activity" /></span>
            <span class="has-text-weight-semibold">
              {{ $filters.uppercaseFirstLetter($gettext(activity, 'activities')) }}
            </span>
          </topoguide-view-small-link>

          <topoguide-view-small-link
            class="column is-4-mobile is-3-tablet"
            :to="{ name: 'route-add', params: { lang: $language.current } }"
          >
            <span class="has-text-success is-size-1"><fa-icon icon="plus" /></span>
            <span class="has-text-success has-text-weight-semibold" v-translate>New route</span>
          </topoguide-view-small-link>
        </div>
      </div>
      <div class="column is-12">
        <h2 class="title is-2 has-text-centered has-background-secondary has-text-light has-rounded-corner">
          {{ $filters.uppercaseFirstLetter($gettext('waypoints')) }}
        </h2>
        <div class="columns is-multiline is-variable is-mobile is-1">
          <topoguide-view-small-link
            class="column is-4-mobile is-2-tablet"
            v-for="waypoint_type of waypoint_types"
            :key="waypoint_type"
            :to="{ name: 'waypoints', query: { wtyp: waypoint_type } }"
          >
            <span class="is-size-1"><icon-waypoint-type :waypoint-type="waypoint_type" /></span>
            <span class="has-text-weight-semibold">
              {{ $filters.uppercaseFirstLetter($gettext(waypoint_type, 'waypoint_types')) }}
            </span>
          </topoguide-view-small-link>

          <topoguide-view-small-link
            class="column is-4-mobile is-2-tablet"
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

<script setup lang="ts">
import { computed } from 'vue';

import TopoguideViewLink from './TopoguideViewLink.vue';
import TopoguideViewSmallLink from './TopoguideViewSmallLink.vue';

import constants from '@/js/constants';

const activities = computed(() => constants.activities);

const waypoint_types = computed(() => constants.waypoint_types);
</script>

<style scoped>
@import '@/assets/css/media.css';

.topoguide {
  position: relative;
  /* the image behind the content, above the background of the page */
  isolation: isolate;
  padding-top: 90px; /* keep the header on a deep color zone */
  padding-bottom: 25px;
  justify-content: center;

  .background-image {
    position: absolute;
    inset: 0;
    z-index: -1;
    width: 100%;
    height: 100%;
    object-fit: cover;
    /* the top of the image, as a background */
    object-position: center top;
  }

  h1 {
    font-size: 3rem;
    color: var(--c2c-light);
    margin-bottom: 25px;
  }

  .links {
    justify-content: center;
    flex-flow: wrap row;
    max-width: 700px;
    margin: auto;
  }

  /* on a phone, the title near the top and the nine bubbles three by three: all on the first screen */
  @media (--c2c-mobile) {
    padding-top: 12px;
    padding-bottom: 12px;

    h1 {
      font-size: 2rem;
      margin-bottom: 8px;
    }
  }
}

.title {
  line-height: 1.5 !important;
}

/* In the phone layout of the app: the gap of these columns (is-variable is-8, 2rem) pushed them out of the screen on
   both sides, 28px wider than it: the page scrolled sideways and the bars of the app showed a white band */
html[data-shell='mobile'] .section.columns {
  margin-left: 0;
  margin-right: 0;
}
</style>
