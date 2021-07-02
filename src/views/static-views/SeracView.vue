<template>
  <div class="serac-view">
    <html-header :title="$gettext('Incidents and accidents')" />
    <div class="serac-view-content">
      <div class="columns is-multiline">
        <div class="column is-12">
          <div class="serac-block has-text-centered has-text-light">
            <h1 class="title is-1 has-text-light has-text-weight-bold" v-translate>SERAC</h1>
            <h3 class="subtitle is-3 has-text-light has-text-weight-bold" v-translate>
              Let's make our feedbacks valuable
            </h3>

            <p v-translate>
              SERAC is a worldwide incidents and accidents database aiming at increasing safety in rock climbing and
              mountain sports.
            </p>
          </div>
        </div>

        <div class="column is-4">
          <div class="serac-block has-text-light content">
            <h3 class="title is-3 has-text-light" v-translate>Near-accidents are valuable</h3>
            <ul>
              <li v-translate>
                Near-accidents = delicate situation not leading to physical injury but could have lead to a much more
                serious event.
              </li>
              <li v-translate>These are positive experiences that reveal usefull risk-management skills.</li>
            </ul>
          </div>
        </div>
        <div class="column is-4">
          <div class="serac-block has-text-light content">
            <h3 class="title is-3 has-text-light" v-translate>How is my testimony used ? How / why is it useful ?</h3>
            <ul>
              <li v-translate>Improve our understanding of risks</li>
              <li v-translate>Contribute to common knowledge</li>
              <li v-translate>Help research activities to define new prevention means</li>
            </ul>
          </div>
        </div>
        <div class="column is-4">
          <div class="serac-block has-text-light content">
            <h3 class="title is-3 has-text-light" v-translate>Anonymity and confidentiality</h3>
            <ul>
              <li v-translate>You can choose to remain anonymous</li>
              <li v-translate>Personal data are confidential</li>
              <li v-translate>SERAC is built upon a kindness mindset. We thank you to improve it</li>
            </ul>
          </div>
        </div>

        <div class="column is-4">
          <add-link document-type="xreport" class="button is-primary has-text-weight-bold">
            <fa-icon icon="plus" />
            &nbsp;
            <span v-translate>Create a new report</span>
          </add-link>
        </div>

        <div class="column is-4">
          <router-link to="xreports" class="button is-warning has-text-weight-bold">
            <fa-icon icon="list" />
            &nbsp;
            <span v-translate>View xreports</span>
          </router-link>
        </div>

        <div class="column is-4">
          <router-link :to="{ name: 'article', params: { id: 697210 } }" class="button is-success has-text-weight-bold">
            <fa-icon icon="info" />
            &nbsp;
            <span v-translate>Know more about SERAC</span>
          </router-link>
        </div>

        <div class="column is-6 is-offset-one-quarter has-text-centered">
          <a
            class="button is-warning has-text-weight-bold is-size-4"
            href="https://www.camptocamp.org/articles/1254260/fr/sommaire-des-analyses-de-recits-de-la-base-serac"
            v-translate
          >
            See the analysis of the submitted stories
          </a>
        </div>

        <div class="column is-12">
          <div class="serac-block">
            <h2 class="title is-2 has-text-light has-text-centered">
              {{ $gettext('xreports') | uppercaseFirstLetter }}
            </h2>
            <div class="columns is-multiline is-mobile serac-activities">
              <topoguide-view-small-link
                class="column topoguide-view-small-link"
                v-for="eventActivity of $options.event_activities"
                :key="eventActivity"
                :to="{ name: 'xreports', query: { act: eventActivity } }"
              >
                <span class="is-size-1"><icon-event-activity :event-activity="eventActivity" /></span>
                <span class="has-text-weight-semibold">
                  {{ $gettext(eventActivity, 'event_activities') | uppercaseFirstLetter }}
                </span>
              </topoguide-view-small-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TopoguideViewSmallLink from './TopoguideViewSmallLink';

import constants from '@/js/constants';

export default {
  components: {
    TopoguideViewSmallLink,
  },

  event_activities: constants.event_activities,
};
</script>

<style scoped lang="scss">
.serac-view {
  background-image: url('~@/assets/img/backgrounds/cermygian-crevasse-800w.jpg');
  background-image: -webkit-image-set(
    url('~@/assets/img/backgrounds/cermygian-crevasse-800w.webp') type('image/webp'),
    url('~@/assets/img/backgrounds/cermygian-crevasse-800w.jpg') type('image/jpeg')
  );
  background-image: image-set(
    url('~@/assets/img/backgrounds/cermygian-crevasse-800w.webp') type('image/webp'),
    url('~@/assets/img/backgrounds/cermygian-crevasse-800w.jpg') type('image/jpeg')
  );
  background-size: cover;
  background-position: center;
  min-height: 100%;
  // 1224px because after 1024px breakpoint, we have an additional 200px wide menu on the left
  @media (min-width: 800px) and (max-width: 1224px) {
    background-image: url('~@/assets/img/backgrounds/cermygian-crevasse-1024w.jpg');
    background-image: -webkit-image-set(
      url('~@/assets/img/backgrounds/cermygian-crevasse-1024w.webp') type('image/webp'),
      url('~@/assets/img/backgrounds/cermygian-crevasse-1024w.jpg') type('image/jpeg')
    );
    background-image: -webkit-image-set(
      url('~@/assets/img/backgrounds/cermygian-crevasse-1024w.webp') type('image/webp'),
      url('~@/assets/img/backgrounds/cermygian-crevasse-1024w.jpg') type('image/jpeg')
    );
  }
  @media (min-width: 1224px) {
    background-image: url('~@/assets/img/backgrounds/cermygian-crevasse-1200w.jpg');
    background-image: -webkit-image-set(
      url('~@/assets/img/backgrounds/cermygian-crevasse-1200w.webp') type('image/webp'),
      url('~@/assets/img/backgrounds/cermygian-crevasse-1200w.jpg') type('image/jpeg')
    );
    background-image: -webkit-image-set(
      url('~@/assets/img/backgrounds/cermygian-crevasse-1200w.webp') type('image/webp'),
      url('~@/assets/img/backgrounds/cermygian-crevasse-1200w.jpg') type('image/jpeg')
    );
  }

  .serac-view-content {
    padding: 10px;
    padding-top: 60px;
    margin: auto;
    max-width: 880px;
  }
}

.serac-block {
  background-color: rgba(21, 50, 69, 0.4);
  padding: 20px;
  height: 100%;
  transition: background-color 300ms;

  ul {
    margin-left: 1em !important;
  }
}

.serac-block:hover {
  background-color: rgba(21, 50, 69, 0.6);
}

.serac-activities {
  max-width: 699px;
  margin-left: auto;
  margin-right: auto;
}

.button {
  display: inline-block;
  width: 100%;
}

.topoguide-view-small-link {
  min-width: 10rem;
}
</style>
