<template>
  <div class="section">
    <!-- Présentation de l'association, info qu'on met en avant -->
    <div>
      <div class="box intro">
        <div class="feed-title">
          <span class="title" :class="{ 'is-marginless': !visible }" v-translate
            >Bienvenue sur Camptocamp ! La communauté des sports de montagne</span
          >
          <fa-icon
            class="is-size-6 no-print accordion-icon mt-2"
            icon="angle-down"
            :rotation="visible ? 180 : undefined"
            @click="toogleProperty('visible')"
          />
        </div>
        <home-banner v-show="visible" />
      </div>
    </div>
    <!-- Partie dashboard/feed -->
    <!-- Switchs -->
    <div
      class="field column is-7"
      :class="{ 'is-12-mobile is-7-tablet is-7-desktop is-8-widescreen is-9-fullhd': feed }"
    >
      <span>
        <input id="c2c-mode" class="toggleCheckbox" type="checkbox" v-model="feed" />
        <label class="toggleContainer" for="c2c_mode">
          <span :class="{ 'is-active': !feed }" v-translate @click="toogleProperty('feed')">Tableau de bord</span>
          <span :class="{ 'is-active': feed }" v-translate @click="toogleProperty('feed')">Activity feed</span>
        </label>
      </span>
      <span :class="{ 'is-pulled-right': !$screen.isMobile }">
        <span v-if="$user.isLogged">
          <input
            id="c2c-personal-feed"
            class="switch is-rtl is-rounded"
            type="checkbox"
            v-model="isPersonal"
            @click="toogleProperty('isPersonal')"
          />
          <label
            for="c2c-personal-feed"
            v-translate
            :title="isPersonal ? $gettext('Personal feed on') : $gettext('Personal feed off')"
          >
            Load my preferences
          </label>
        </span>
        <router-link to="preferences" class="has-text-normal" :title="$gettext('My preferences')">
          <fa-icon icon="gears" />
        </router-link>
      </span>
    </div>
    <!-- Feed -->
    <div class="feed-view" v-if="feed">
      <feed-view :is-personal="isPersonal" />
    </div>
    <!-- Dashboard -->
    <div v-if="!feed">
      <dashboard-view :is-personal="isPersonal" />
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
      isPersonal: this.$localStorage.get('isPersonal', false),
      feed: this.$localStorage.get('feed', false),
      visible: state,
    };
  },

  methods: {
    toogleProperty(property) {
      this.setProperty(property, !this[property]);
    },
    setProperty(property, value) {
      this[property] = value;
      this.$localStorage.set(`${property}`, this[property]);
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

.switch[type='checkbox']:checked + label::before {
  background: #f93;
}

.toggleCheckbox {
  display: none;
}

.toggleContainer {
  position: relative;
  border-radius: 20px;
  background: #f93;
  color: white;
  padding: 5px 2px;
  cursor: pointer;
}

.is-active {
  color: #4a4a4a;
  border-radius: 20px;
  background: white;
  transition: color 0.3s;
}

.toggleContainer span {
  padding: 3px 10px;
  text-align: center;
  z-index: 100;
}
</style>
<style lang="scss">
h4 > a,
h6 > a,
.outing-date-header > a,
li > a {
  color: #4a4a4a !important;
}

h4 > a:hover,
h6 > a:hover,
.outing-date-header > a:hover {
  color: #337ab7 !important;
}
</style>
