<template>
  <section>
    <div>
      <div class="title is-4 has-text-weight-normal" v-translate>
        Camptocamp.org aims to facilitate information sharing between mountain addicts and contribute to the safety of
        mountain activities.
      </div>
      <div>
        <p>Vous trouverez ici :</p>
        <ul>
          <li>des itinéraires pour vous indiquer le chemin</li>
          <li>des sorties pour les conditions</li>
          <li>une base de données incidents/accidents : Sérac</li>
          <li>une aide à la gestion du risque d'avalanche : Yéti</li>
          <li>une bibliothèque comportant des articles et des références de livres</li>
          <li>un forum pour discuter de sujets techniques ou simplement papoter</li>
        </ul>
      </div>

      <!--<div class="buttons is-centered">
        <router-link :to="{ name: 'topoguide' }" class="button is-primary">
          <icon-topoguide />&nbsp; <span v-translate="">Topoguide</span><br />
          <span v-translate="" class="is-size-4">Conditions, summits, routes</span>...
        </router-link>

        <router-link :to="{ name: 'forum' }" class="button is-primary">
          <icon-forum />&nbsp; <span v-translate>Forum</span><br />
          <span v-translate class="is-size-4">Share with us!</span>
        </router-link>
      </div>-->
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
/*section {
  background-image: url('~@/assets/img/backgrounds/alexbuisse-greenland-800w.jpg');
  background-size: cover;
  background-position-y: 50%;
  // 1224px because after 1024px breakpoint, we have an additional 200px wide menu on the left
  @media (min-width: 800px) and (max-width: 1224px) {
    background-image: url('~@/assets/img/backgrounds/alexbuisse-greenland-1024w.jpg');
  }
  @media (min-width: 1224px) {
    background-image: url('~@/assets/img/backgrounds/alexbuisse-greenland-1200w.jpg');
  }
}*/

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
  background-color: rgba(21, 50, 69, 0.4);
  color: #fff;
}

.outings-links {
  line-height: 60px;
  margin-top: 60px;

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
