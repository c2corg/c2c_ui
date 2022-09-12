<template>
  <div class="section">
    <!-- Présentation de l'association, info qu'on met en avant -->
    <div>
      <div class="box intro">
        <div class="feed-title">
          <span class="title is-1" v-translate>Welcome to Camptocamp ! The mountain sports community</span>
          <!--Display parameters-->
          <dropdown-button class="is-right">
            <span slot="button" class="button">
              <fa-icon icon="cogs" />
              <span class="is-hidden-mobile">&nbsp;</span>
              <span class="is-hidden-mobile" v-translate>Display parameters</span>
            </span>
            <!--Show intro text or not-->
            <a
              class="dropdown-item is-size-6"
              :class="{ 'is-active': visible }"
              @click="toogleProperty('visible')"
            >
              <span class="is-nowrap item-icons">
                <fa-icon :icon="visible ? 'circle-check' : 'circle'" />
              </span>
              <span class="is-nowrap" v-translate>Show intro text</span>
            </a>
            <hr/>
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
              <span class="is-nowrap" v-translate>Enable personal preferences</span>
            </a>
            <hr v-if="$user.isLogged"/>
            <!--Dashboard/Dense-->
            <a
              class="dropdown-item is-size-6"
              :class="{ 'is-active': denseMode }"
              @click="toogleProperty('denseMode')"
            >
              <span class="is-nowrap item-icons">
                <fa-icon icon="th-list" />
              </span>
              <span class="is-nowrap" v-translate>Dense</span>
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
              <span class="is-nowrap" v-translate>Comfortable</span>
            </a>
          </dropdown-button>
        </div>
        <div v-show="visible">
          <div class="title is-4 has-text-weight-normal" v-translate>
              Camptocamp.org aims to facilitate information sharing between mountain addicts and contribute to the safety of
              mountain activities.
          </div>
          <div class="columns">
            <div class="column is-12-mobile" v-if="!$user.isLogged">
              <div>
                <p>Vous trouverez ici :</p>
                <ul>
                  <li><icon-route/> <router-link to="routes"><span v-translate>dse itinéraires à parcourir</span></router-link></li>
                  <li><icon-outing/> <router-link to="outings"><span v-translate>des sorties pour avoir les dernières conditions</span></router-link></li>
                  <li><icon-xreport/> <span v-translate>une base de données incidents/accidents</span> : <router-link to="serac">SERAC</router-link></li>
                  <li><icon-yeti/> <span v-translate>une aide à la gestion du risque d'avalanche</span> : <router-link to="yeti">Yeti</router-link></li>
                  <li>une bibliothèque comportant des <icon-article/> <router-link to="articles">articles</router-link> et des <icon-book/> <router-link to="books">références de livres</router-link></li>
                  <li><icon-forum/> <router-link to="forum" v-translate> un forum pour discuter de sujets techniques ou bavarder</router-link></li>
                </ul>
              </div>
            </div>
            <div class="column is-12-mobile" >
              <p><router-link :to="{ name: 'article', params: { id: 106726 } }" v-translate>Association</router-link> est la structure bénévole à but non lucratif assurant la gestion du site camptocamp.org</p>
              <ul>
              <router-link :to="{ name: 'article', params: { id: 106726 } }" class="menu-brand has-text-centered">
                <img src="https://forum.camptocamp.org/uploads/default/original/3X/c/d/cd8d2daad7ec44d36b3182ec451767db3fc2509c.png" alt="CamptocampAssociation" class="logo-association" />
              </router-link>
                <li><a href="https://www.helloasso.com/associations/camptocamp-association" :title="$gettext('Join us')">
                    Pour participer ou vous investir : rejoignez nous
                  </a></li>
                <li><fa-icon icon="heart" class="donate-icon" />
                  <a href="https://www.helloasso.com/associations/camptocamp-association" :title="$gettext('Donate')">
                    Pour soutenir financièrement (serveurs, développements…) : faites un don
                  </a>
                </li>
              </ul>
            </div>
            <div class="column is-12-mobile">
              <h3 class="title is-4">Partage du moment :</h3>
              <i>Le petit bout de code qui va bien pour afficher une publi Facebook ou autre</i>
          </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Partie dashboard/feed -->
    <!-- Feed -->
    <div class="feed-view" v-if="!denseMode">
      <div class="columns">
        <div class="column is-12-mobile is-7-tablet is-7-desktop is-8-widescreen is-9-fullhd">
          <feed-widget :type="isPersonal && $user.isLogged ? 'personal' : 'default'" hide-empty-documents />
        </div>
        <div
          v-if="!$screen.isMobile"
          class="column is-hidden-mobile is-5-tablet is-5-desktop is-4-widescreen is-3-fullhd"
        >
          <useful-links />
          <div class="box">
            <h4 class="title is-3">
              <router-link to="forum">
                <icon-forum />
                {{ $gettext('Forum') }}
              </router-link>
            </h4>
            <forum-widget :message-count="20" />
            <hr/>
            <h6 class="title is-6 has-text-centered">
              <router-link to="forum">
                <span v-translate>Voir plus</span>
              </router-link>
            </h6>
          </div>
        </div>
      </div>
    </div>
    <!-- Dashboard -->
    <div v-if="denseMode">
      <div class="columns">
        <div class="column is-7">
          <!-- Sorties -->
          <div class="box">
            <h4 class="title is-3">
              <router-link to="outings">
                <icon-outing />
                {{ $gettext('outings') | uppercaseFirstLetter }}
              </router-link>
            </h4>
            <loading-notification :promise="outingsPromise" />
            <div v-if="outingsByDate != null">
              <div v-for="(sortedOutings, date) of outingsByDate" :key="date">
                <p class="outing-date-header is-4 is-italic has-text-weight-bold">
                  <router-link :to="{ name: 'outings', query: { date: `${date},${date}` } }">
                    {{ $dateUtils.toLocalizedString(date, 'PPPP') | uppercaseFirstLetter }}
                  </router-link>
                </p>
                <dashboard-outing-link v-for="outing of sortedOutings" :key="outing.document_id" :outing="outing" />
              </div>
            </div>
            <hr/>
            <h6 class="title is-6 has-text-centered">
              <router-link to="outings">
                <span v-translate>Voir plus</span>
              </router-link>
            </h6>
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
            <hr/>
            <h6 class="title is-6 has-text-centered">
              <router-link to="routes">
                <span v-translate>Voir plus</span>
              </router-link>
            </h6>
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
            <hr/>
            <h6 class="title is-6 has-text-centered">
              <router-link to="images">
                <span v-translate>Voir plus</span>
              </router-link>
            </h6>
          </div>
          <useful-links />
          <!-- Forum -->
          <div class="box">
            <h4 class="title is-3">
              <router-link to="forum">
                <icon-forum />
                {{ $gettext('Forum') }}
              </router-link>
            </h4>
            <forum-widget :message-count="20" />
            <hr/>
            <h6 class="title is-6 has-text-centered">
              <router-link to="forum">
                <span v-translate>Voir plus</span>
              </router-link>
            </h6>
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
            <hr/>
            <h6 class="title is-6 has-text-centered">
              <router-link to="articles">
                <span v-translate>Voir plus</span>
              </router-link>
            </h6>
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
import UsefulLinks from './utils/UsefulLinks';

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
    UsefulLinks,
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
      denseMode: true,
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
  display: flex;
  align-items: baseline;

  span:first-child {
    flex-grow: 1;
  }
}

ul {
  //list-style-type: disc !important;
  //padding-left: 12px;
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
  margin-bottom: 0.5rem;
}

.intro {
  margin-bottom: 1.5rem;
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

.logo-association {
  max-width: 50%;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
</style>
