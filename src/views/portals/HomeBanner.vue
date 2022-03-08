<template>
  <section>
    <div class="intro-banner has-text-centered">
      <div class="title with-background" v-translate>The mountain sports community</div>

      <div class="outings-links">
        <router-link
          v-for="activity of $options.activities"
          :key="activity"
          :to="{ name: 'outings', query: { act: activity } }"
          :title="$gettext(activity, 'activities')"
          class="outings-link"
        >
          <icon-activity :activity="activity" />
        </router-link>
      </div>

      <div class="title is-4 has-text-weight-normal with-background">
        <p v-translate>
          Camptocamp.org aims to facilitate information sharing between mountain addicts and contribute to the safety of
          mountain activities.
        </p>
        <p v-translate>
          Ce site est géré par une association à but non lucratif, qui a fait le choix de contenus sous licences libres.
        </p>
        <p v-translate>N'hésitez pas à vous inscrire et à contribuer !</p>
      </div>

      <div class="buttons is-centered">
        <router-link :to="{ name: 'topoguide' }" class="button is-primary">
          <icon-topoguide />&nbsp; <span v-translate>Topoguide</span><br />
          <span v-translate="" class="is-size-4">Conditions, summits, routes</span>...
        </router-link>

        <router-link :to="{ name: 'forum' }" class="button is-primary">
          <icon-forum />&nbsp; <span v-translate>Forum</span><br />
          <span v-translate class="is-size-4">Share with us!</span>
        </router-link>

        <router-link :to="{ name: 'article', params: { id: 106726 } }" class="button is-primary">
          <icon-forum />&nbsp; <span v-translate>C2C Association</span><br />
          <span v-translate class="is-size-4">Nous découvrir...</span>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  activities: [
    'skitouring',
    'snow_ice_mixed',
    'mountain_climbing',
    'rock_climbing',
    'ice_climbing',
    'hiking',
    'snowshoeing',
    'paragliding',
    'mountain_biking',
    'via_ferrata',
    'slacklining',
  ],
};
</script>

<style scoped lang="scss">
section {
  background-image: url(https://forum.camptocamp.org/uploads/default/optimized/3X/7/7/77e494902c10e5f9034eafff02fc8397114f7cc9_2_1200x675.jpeg);
  background-size: cover;
  //background-position-y: 50%;
  // 1224px because after 1024px breakpoint, we have an additional 200px wide menu on the left
  /*@media (min-width: 800px) and (max-width: 1224px) {
    background-image: url('~@/assets/img/backgrounds/alexbuisse-greenland-1024w.jpg');
  }
  @media (min-width: 1224px) {
    background-image: url('~@/assets/img/backgrounds/alexbuisse-greenland-1200w.jpg');
  }*/
}

.intro-banner {
  padding-bottom: 40px;
  padding-top: 70px;
  color: #fff;
  width: 80%;
  min-width: 730px;
  height: 100%;
  margin: auto;
  align-items: center;
}

.title.is-4 {
  margin-top: 25px;
}

.with-background {
  padding: 10px;
  background-color: rgba(21, 50, 69, 0.6);
  color: #fff;
}

.outings-links {
  line-height: 60px;
  margin-top: 40px;

  .outings-link svg {
    vertical-align: text-bottom;
    margin: 5px;
    color: $color-base-c2c;
    background-color: #fff;
    border-radius: 50%;
    font-size: 4rem;
    width: 4rem;
    height: 4rem;
  }
}

.button {
  display: inline-block;
  height: auto;
}

@media screen and (max-width: $tablet) {
  .intro-banner {
    width: 100%;
    min-width: auto;
    padding: 20px;
  }

  .title.is-4 {
    margin-top: 0;
  }
}
</style>
