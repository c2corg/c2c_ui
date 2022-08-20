<template>
  <div>
    <!-- Présentation de l'association, info qu'on met en avant -->
    <div class="section">
      <div class="box">
        <div class="feed-title">
          <span class="title is-1" v-translate>Welcome to Camptocamp ! The mountain sports community</span>
          <fa-icon
            class="is-size-6 is-pulled-right has-cursor-pointer no-print"
            icon="angle-down"
            :rotation="visible ? undefined : 180"
            @click="visible = !visible"
          />
        </div>
        <div v-show="visible">
          <div class="title is-4 has-text-weight-normal" v-translate>
              Camptocamp.org aims to facilitate information sharing between mountain addicts and contribute to the safety of
              mountain activities.
          </div>
          <div class="columns">
            <div class="column is-12-mobile is-4-tablet is-4-desktop is-4-widescreen is-4-fullhd" v-if="!$user.isLogged">
              <div>
                <p>Vous trouverez ici :</p>
                <ul>
                  <li><router-link to="routes"><span v-translate>routes</span></router-link> pour vous indiquer le chemin</li>
                  <li><router-link to="outings"><span v-translate>outings</span></router-link> pour les conditions</li>
                  <li>une base de données incidents/accidents : <router-link to="serac">SERAC</router-link></li>
                  <li>une aide à la gestion du risque d'avalanche : <router-link to="yeti">Yeti</router-link></li>
                  <li>une bibliothèque comportant des <router-link to="articles">articles</router-link> et des <router-link to="books">références de livres</router-link></li>
                  <li>un <router-link to="forum">forum</router-link> pour discuter de sujets techniques ou simplement papoter</li>
                </ul>
              </div>
            </div>
            <div class="column is-12-mobile is-4-tablet is-4-desktop is-4-widescreen is-4-fullhd">
              <p>Ce site est géré par une association à but non lucratif, qui a fait le choix de contenus sous licences libres, et dont les acteurs sont bénévoles.</p>
              <ul>
                <li>Vous souhaitez vous investir ou participer aux coulisses du topoguide : rejoignez <router-link :to="{ name: 'article', params: { id: 106726 } }" v-translate>Association</router-link>.</li>
                <li>Vous souhaitez simplement aider financièrement le site (serveurs, développements...) :
                  <a href="https://www.helloasso.com/associations/camptocamp-association" :title="$gettext('Donate')">
                    faites un don
                    <fa-icon icon="heart" class="donate-icon" />
                  </a>
                </li>
              </ul>
            </div>
            <div class="column is-12-mobile is-4-tablet is-4-desktop is-4-widescreen is-4-fullhd">
              <h3 class="title is-4">Partage du moment :</h3>
              <i>Le petit bout de code qui va bien pour afficher une publi Facebook ou autre</i>
          </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Partie dashboard/feed -->
    <!-- Swicht dashboard/feed -->
    <div class="feed-title">
      <span @click="toogleProperty('listMode')" class="is-size-3 has-text-weight-semibold has-cursor-pointer">
        <span :class="listMode ? 'has-text-primary' : ''" :title="$gettext('Dashboard')" v-translate>Dashboard</span> /
        <span :class="!listMode ? 'has-text-primary' : ''" :title="$gettext('Feed')" v-translate>Activity feed</span>
      </span>
      <div class="field" v-if="$user.isLogged">
        <input
          id="c2c-personal-feed"
          class="switch is-rtl is-rounded is-info"
          type="checkbox"
          v-model="isPersonal"
          @change="saveIsPersonalState"
        />
        <label
          for="c2c-personal-feed"
          v-translate
          :title="isPersonal ? $gettext('Personal feed on') : $gettext('Personal feed off')"
        >
          Activer mes préférences
        </label>
      </div>
    </div>
    <!-- Feed -->
    <div class="section feed-view" v-if="!listMode">
      <div class="columns">
        <div class="column is-12-mobile is-7-tablet is-7-desktop is-8-widescreen is-9-fullhd">
          <feed-widget :type="isPersonal && $user.isLogged ? 'personal' : 'default'" hide-empty-documents />
        </div>
        <div
          v-if="!$screen.isMobile"
          class="column is-hidden-mobile is-5-tablet is-5-desktop is-4-widescreen is-3-fullhd box"
        >
          <h3 class="title is-4" v-translate>Last forum topics</h3>
          <forum-widget :message-count="20" />
        </div>
      </div>
    </div>
    <!-- Dashboard -->
    <div class="section" v-if="listMode">
      <div class="columns">
        <div class="column is-7">
          <!-- Sorties -->
          <div class="box">
            <h4 class="title is-2">
              <router-link to="outings">
                <icon-outing />
                {{ $gettext('outings') | uppercaseFirstLetter }}
              </router-link>
            </h4>
            <loading-notification :promise="outingsPromise" />
            <div v-if="outingsByDate != null">
              <div v-for="(sortedOutings, date) of outingsByDate" :key="date">
                <h4 class="outing-date-header has-text-centered is-italic has-text-weight-bold">
                  <router-link :to="{ name: 'outings', query: { date: `${date},${date}` } }">
                    {{ $dateUtils.toLocalizedString(date, 'PPPP') | uppercaseFirstLetter }}
                  </router-link>
                </h4>
                <dashboard-outing-link v-for="outing of sortedOutings" :key="outing.document_id" :outing="outing" />
              </div>
            </div>
          </div>
          <!-- Itinéraires -->
          <div class="box">
            <h4 class="title is-3">
              <router-link to="routes">
                <icon-route />
                {{ $gettext('routes') | uppercaseFirstLetter }}
              </router-link>
            </h4>
            <loading-notification :promise="routesPromise" />
            <div v-if="routes != null">
              <dashboard-route-link v-for="route of routes.documents" :key="route.document_id" :route="route" />
            </div>
          </div>
        </div>
        <div class="column is-5">
          <!-- Images -->
          <div class="box">
            <h4 class="title is-3">
              <router-link to="images">
                <icon-image />
                {{ $gettext('images') | uppercaseFirstLetter }}
              </router-link>
            </h4>
            <div class="images-container">
              <loading-notification :promise="imagesPromise" />
              <gallery v-if="images != null" :images="images.documents" />
            </div>
          </div>
          <!-- Liens utiles -->
          <div class="box">
            <h4 class="title is-3">Liens utiles</h4>
            <div>
              <ul>
                <li>
                  <router-link :to="{ name: 'article', params: { id: 107228 } }" v-translate>Préparer sa course</router-link>
                </li>
                <li>
                  <router-link :to="{ name: 'yeti' }" v-translate>Yeti : un outil pour évaluer le risque d’avalanche</router-link>
                </li>
                <li>
                  <a href="https://www.metaskirando.ovh/" title="Metaskirando">Metaskirando : sorties de ski de rando en Europe</a>
                </li>
                <li>
                  <router-link :to="{ name: 'serac' }" v-translate>SERAC : accidents et incidents en montagne</router-link>
                </li>
              </ul>
              <ul>
                <li>
                  <router-link :to="{ name: 'article', params: { id: 106726 } }" v-translate>Camptocamp Association</router-link>
                </li>
                <li>
                  <a href="https://www.helloasso.com/associations/camptocamp-association/" title="Helloasso">Faire un don ou adhérer</a>
                </li>
              </ul>
            </div>
          </div>
          <!-- Forum -->
          <div class="box">
            <h4 class="title is-3">
              <router-link to="forum">
                <icon-forum />
                {{ $gettext('Forum') }}
              </router-link>
            </h4>
            <forum-widget :message-count="20" />
          </div>
          <!-- Articles -->
          <div class="box">
            <h4 class="title is-3">
              <router-link to="articles">
                <icon-article />
                {{ $gettext('articles') | uppercaseFirstLetter }}
              </router-link>
            </h4>
            <loading-notification :promise="articlesPromise" />
            <div v-if="articles != null">
              <dashboard-article-link
                v-for="article of articles.documents"
                :key="article.document_id"
                :article="article"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

//import HomeBanner from './HomeBanner';
import DashboardArticleLink from './utils/DashboardArticleLink';
import DashboardOutingLink from './utils/DashboardOutingLink';
import DashboardRouteLink from './utils/DashboardRouteLink';
import ForumWidget from './utils/ForumWidget';

import FeedWidget from '@/components/feed-widget/FeedWidget';
import Gallery from '@/components/gallery/Gallery';
import c2c from '@/js/apis/c2c';

export default {
  name: 'FeedView',

  components: {
    //HomeBanner,
    FeedWidget,
    DashboardArticleLink,
    DashboardOutingLink,
    DashboardRouteLink,
    ForumWidget,
    Gallery,
    },

  data() {
    return {
      isPersonal: false,
      enableUserPreferences: this.$localStorage.get('enableUserPreferences', false),
      outingsPromise: null,
      routesPromise: null,
      articlesPromise: null,
      imagesPromise: null,
      listMode: true,
      visible: true,
    };
  },

  computed: {
    outings() {
      return this.outingsPromise.data;
    },

    images() {
      return this.imagesPromise.data;
    },

    routes() {
      return this.routesPromise.data;
    },

    articles() {
      return this.articlesPromise.data;
    },

    outingsByDate() {
      if (!this.outings) {
        return null;
      }

      const result = {};

      for (const outing of this.outings.documents) {
        result[outing.date_end] = result[outing.date_end] ?? [];
        result[outing.date_end].push(outing);
      }

      return result;
    },
  },

  watch: {
    enableUserPreferences: 'loadOutings',
  },

  created() {
    this.isPersonal = this.$localStorage.get('isPersonal', false);
    this.loadOutings();
    this.routesPromise = c2c.route.getAll({ limit: 5 });
    this.articlesPromise = c2c.article.getAll({ limit: 5 });
    this.imagesPromise = c2c.image.getAll();
  },

  methods: {
    saveIsPersonalState() {
      this.$localStorage.set('isPersonal', this.isPersonal);
    },

    loadOutings() {
      this.$localStorage.set('enableUserPreferences', this.enableUserPreferences);

      if (!this.enableUserPreferences || !this.$user.isLogged) {
        this.loadOutingsWithQuery();
      } else {
        this.outingsPromise = this.getQueryFromUserPreferences('outing').then(this.loadOutingsWithQuery);
      }
    },

    loadOutingsWithQuery(query = {}) {
      query.limit = 40;
      this.outingsPromise = c2c.outing.getAll(query);
    },

    getQueryFromUserPreferences(documentType) {
      return new Promise(function (resolve) {
        c2c.userProfile.preferences.get().then((result) => {
          const preferences = result.data;
          const query = {};

          if (['outing', 'route', 'image', 'xreport', 'books', 'articles'].includes(documentType)) {
            const activities = preferences.activities.join(',');
            query.act = activities === '' ? undefined : activities;
          }

          if (['outing', 'route', 'image', 'xreport', 'waypoint'].includes(documentType)) {
            const areas = preferences.areas.map((area) => area.document_id).join(',');
            query.a = areas === '' ? undefined : areas;
            query.bbox = undefined;
          }

          resolve(query);
        });
      });
    },

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
  margin-left: 21px;
  display: flex;
  align-items: baseline;

  span:first-child {
    flex-grow: 1;
  }
}

ul {
  list-style-type: disc !important;
}

.cards-container > div {
  justify-content: center;
  margin: auto;
}

.images-container {
  min-height: 200px;
}

h4 {
  padding-bottom: 0.7rem !important;
  margin-bottom: 0.7rem !important;
  border-bottom: 1px solid #ddd;
}

.outing-date-header {
  margin-top: 1rem;
}
</style>
