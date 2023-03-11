<template>
  <section>
    <div class="columns">
      <div class="column is-12-mobile">
        <div class="subtitle" v-translate>
          Camptocamp.org aims to facilitate information sharing between mountain addicts and contribute to the safety of
          mountain activities.
        </div>
        <div class="columns">
          <div class="column is-12-mobile">
            <div>
              <p v-translate>Vous trouverez ici :</p>
              <ul>
                <li>
                  <icon-route />
                  <router-link to="routes"><span v-translate>des itinéraires à parcourir</span></router-link>
                </li>
                <li>
                  <icon-outing />
                  <router-link to="outings">
                    <span v-translate>des sorties pour avoir les dernières conditions</span>
                  </router-link>
                </li>
                <li>
                  <icon-xreport />
                  <span v-translate>une base de données incidents/accidents</span> :
                  <router-link to="serac">SERAC</router-link>
                </li>
                <li>
                  <icon-yeti />
                  <span v-translate>une aide à la gestion du risque d'avalanche</span> :
                  <router-link to="yeti">Yeti</router-link>
                </li>
                <li>
                  <span v-translate>une bibliothèque comportant des</span>
                  <icon-article />
                  <router-link to="articles" v-translate>articles</router-link>
                  <span v-translate>et des </span>
                  <icon-book />
                  <router-link to="books" v-translate>books</router-link>
                </li>
                <li>
                  <icon-forum />
                  <router-link to="forum" v-translate>
                    un forum pour discuter de sujets techniques ou bavarder
                  </router-link>
                </li>
              </ul>
            </div>
          </div>
          <div class="column is-12-mobile">
            <p>
              <router-link :to="{ name: 'article', params: { id: 106726 } }" v-translate> Association</router-link>
              <span v-translate>
                est la structure bénévole à but non lucratif assurant la gestion du site camptocamp.org
              </span>
            </p>
            <router-link :to="{ name: 'article', params: { id: 106726 } }" class="menu-brand has-text-centered">
              <img
                src="https://forum.camptocamp.org/uploads/default/original/3X/c/d/cd8d2daad7ec44d36b3182ec451767db3fc2509c.png"
                alt="CamptocampAssociation"
                class="logo-association"
              />
            </router-link>
            <ul>
              <li>
                <a href="https://www.helloasso.com/associations/camptocamp-association" :title="$gettext('Join us')">
                  <span v-translate>Pour participer ou vous investir : rejoignez nous</span>
                </a>
              </li>
              <li>
                <fa-icon icon="heart" class="donate-icon" />
                <a href="https://www.helloasso.com/associations/camptocamp-association" :title="$gettext('Donate')">
                  <span v-translate>Pour soutenir financièrement (serveurs, développements…) : faites un don</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'HomeBanner',

  props: {
    feed: {
      type: Boolean,
      required: true,
    },
  },
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

/*.outings-links {
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
}*/

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

.logo-association {
  max-width: 35%;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
</style>
