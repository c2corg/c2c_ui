<template>
  <div class="section">
    <!-- Présentation de l'association, info qu'on met en avant -->
    <div>
      <div class="box intro">
        <div class="feed-title">
          <span class="title" :class="{ 'is-marginless': !visible }" v-translate
            >Bienvenue sur Camptocamp ! La communauté des sports de montagne</span
          >
          <!--Display parameters-->
          <dropdown-button class="is-right">
            <span slot="button" class="button">
              <fa-icon icon="cogs" />
              <span class="is-hidden-mobile">&nbsp;</span>
              <span class="is-hidden-mobile" v-translate>Paramètres d'affichage</span>
            </span>
            <!--Show intro text or not-->
            <a class="dropdown-item is-size-6" :class="{ 'is-active': visible }" @click="toogleProperty('visible')">
              <span class="is-nowrap item-icons">
                <fa-icon :icon="visible ? 'circle-check' : 'circle'" />
              </span>
              <span class="is-nowrap" v-translate>Afficher le texte de présentation</span>
            </a>
            <hr />
            <!--User preferences-->
            <a
              class="dropdown-item is-size-6"
              :class="{ 'is-active': enableUserPreferences }"
              @click="toogleProperty('enableUserPreferences')"
              v-if="$user.isLogged"
            >
              <span class="is-nowrap item-icons">
                <fa-icon :icon="enableUserPreferences ? 'circle-check' : 'circle'" />
              </span>
              <span class="is-nowrap" v-translate>Load my preferences</span>
            </a>
            <hr v-if="$user.isLogged" />
            <!--Dashboard/Dense-->
            <a class="dropdown-item is-size-6" :class="{ 'is-active': denseMode }" @click="toogleProperty('denseMode')">
              <span class="is-nowrap item-icons">
                <fa-icon icon="th-list" />
              </span>
              <span class="is-nowrap" v-translate>Tableau de bord</span>
            </a>
            <!--Feed/Comfortable-->
            <a
              class="dropdown-item is-size-6"
              :class="{ 'is-active': !denseMode }"
              @click="toogleProperty('denseMode')"
            >
              <span class="is-nowrap item-icons">
                <fa-icon icon="th-large" />
              </span>
              <span class="is-nowrap" v-translate>Activity feed</span>
            </a>
          </dropdown-button>
        </div>
        <home-banner v-show="visible" />
      </div>
    </div>
    <!-- Partie dashboard/feed -->
    <!-- Feed -->
    <div class="feed-view" v-if="!denseMode">
      <feed-view :is-personal="enableUserPreferences" />
    </div>
    <!-- Dashboard -->
    <div v-if="denseMode">
      <dashboard-view :enable-user-preferences="enableUserPreferences" />
    </div>
  </div>
</template>

<script>
import DashboardView from './DashboardView';
import FeedView from './FeedView';
import HomeBanner from './HomeBanner';

export default {
  name: 'HomeView',

  components: {
    HomeBanner,
    FeedView,
    DashboardView,
  },

  data() {
    let state = true;

    if (this.$user.isLogged) {
      state = false;
    }
    return {
      enableUserPreferences: this.$localStorage.get('enableUserPreferences', false),
      denseMode: true,
      visible: state,
    };
  },

  methods: {
    toogleProperty(property) {
      this.setProperty(property, !this[property]);
    },
    setProperty(property, value) {
      this[property] = value;
      this.$localStorage.set(`${this.documentType}.${property}`, this[property]);
    },
  },
};
</script>

<style scoped lang="scss">
@media screen and (max-width: $tablet) {
  .feed-view {
    padding-left: 0;
    padding-right: 0;

    .feed-title {
      padding-left: 0;
      padding-right: 0;
    }
  }
}

.feed-title {
  //margin-bottom: 12px;
  display: flex;
  //align-items: baseline;

  span:first-child {
    flex-grow: 1;
  }
}

h4 {
  padding-bottom: 0.7rem !important;
  margin-bottom: 0.7rem !important;
  border-bottom: 1px solid #ddd;
}

.intro {
  margin-bottom: 1rem;
}

//Variables already used on sidemenu
$brandLogoHeight: 70px;
//$brandLogoMargin: 5px;

.menu-brand {
  //display: block;
  line-height: 0;

  img {
    height: $brandLogoHeight;
    //margin: $brandLogoMargin 0;
  }
}
</style>
