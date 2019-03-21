<template>
  <nav class="is-size-5" :class="{'has-background-warning':siteConfiguration.urls.name != 'prod'}">

    <span
      class="navigation-item is-hidden-desktop"
      :class="{'is-hidden-mobile': !hideSearchInput}"
      @click="$emit('toggleSideMenu')">
      <span class="button">
        <fa-icon icon="bars" />
      </span>
    </span>

    <router-link
      :to="{name:'home'}"
      class="navigation-item navigation-brand has-text-centered"
      :class="{'is-hidden-mobile': !hideSearchInput}">
      <img
        src="@/assets/img/logo.svg"
        url="@/assets/img/logo.svg"
        alt="Camptocamp.org">
    </router-link>

    <div class="navigation-end">
      <div ref="searchInputContainer">
        <input-document
          class="navigation-item search-input"
          :class="{'is-hidden-mobile': hideSearchInput}"
          :document-type="['waypoint', 'route', 'article', 'book']"
          propose-creation
          show-more-results-link
          @input="go" />

        <div
          class="navigation-item is-hidden-tablet"
          :class="{'is-hidden-mobile': !hideSearchInput}">
          <span class="button" @click="hideSearchInput=false">
            <fa-icon icon="search" />
          </span>
        </div>
      </div>

      <div v-if="!siteConfiguration.isProduction" class="navigation-item is-hidden-mobile" :title="'This page may contains bugs or incomplete features'">
        <fa-icon icon="bug" size="lg" class="has-text-danger" />
      </div>

      <div v-if="!siteConfiguration.isProduction" class="navigation-item dropdown is-hoverable is-hidden-mobile">
        <div class="dropdown-trigger">
          <fa-icon icon="database" />
        </div>
        <div class="dropdown-menu">
          <div class="dropdown-content">
            <a
              v-for="(urlsConfiguration, i) of Object.values(siteConfiguration.urlsConfigurations)"
              :key="i"
              class="dropdown-item is-size-5"
              :class="{'is-active': urlsConfiguration.name === siteConfiguration.urls.name}"
              @click="setUrlsConfiguration(urlsConfiguration.name)">
              <span>{{ urlsConfiguration.name }}</span>
            </a>
          </div>
        </div>
      </div>

      <div class="navigation-item">
        <add-link document-type="outing" is-short-link-on-mobile class="button is-primary" />
      </div>

      <div v-if="!$user.isLogged" class="navigation-item">
        <login-button class="is-link">
          <span class="is-hidden-touch" v-translate>Login</span>
          &nbsp;
          <fa-icon icon="sign-in-alt" />
        </login-button>
      </div>

      <div v-else class="navigation-item">
        <dropdown-button class="is-right">
          <span slot="button" class="button">
            <img
              width="24"
              height="24"
              :src="$options.forumUrl + '/user_avatar/forum.camptocamp.org/' + $user.forumUsername + '/24/1_1.png'">
            <span class="has-text-weight-bold is-hidden-mobile">
              &nbsp;{{ $user.name }}
            </span>
          </span>

          <router-link :to="{ name: 'profile', params:{id:$user.id} }" class="dropdown-item is-size-5">
            <fa-icon icon="user" />
            <span>&nbsp;</span>
            <span v-translate>My profile</span>
          </router-link>
          <router-link :to="{ name: 'account' }" class="dropdown-item is-size-5">
            <fa-icon icon="check-circle" />
            <span>&nbsp;</span>
            <span v-translate>My account</span>
          </router-link>
          <router-link :to="{ name: 'preferences' }" class="dropdown-item is-size-5">
            <fa-icon icon="cogs" />
            <span>&nbsp;</span>
            <span v-translate>My preferences</span>
          </router-link>
          <router-link :to="{ name: 'outings', query:{u:$user.id} }" class="dropdown-item is-size-5">
            <icon-outing />
            <span>&nbsp;</span>
            <span v-translate>My outings</span>
          </router-link>
          <router-link :to="{ name: 'whatsnew', query:{u:$user.id} }" class="dropdown-item is-size-5">
            <fa-icon icon="edit" />
            <span>&nbsp;</span>
            <span v-translate>My changes</span>
          </router-link>
          <router-link :to="{ name: 'following' }" class="dropdown-item is-size-5">
            <fa-icon icon="heart" />
            <span>&nbsp;</span>
            <span v-translate>My followed users</span>
          </router-link>
          <router-link :to="{ name: 'mailinglists' }" class="dropdown-item is-size-5">
            <fa-icon icon="at" />
            <span>&nbsp;</span>
            <span v-translate>My mailing lists</span>
          </router-link>

          <hr class="dropdown-divider">

          <a class="dropdown-item is-size-5" @click="$user.signout()">
            <fa-icon icon="sign-out-alt" />
            <span>&nbsp;</span>
            <span v-translate>Logout</span>
          </a>
        </dropdown-button>
      </div>
      <div v-if="!$user.isLogged" class="navigation-item">
        <dropdown-button class="is-right">
          <button class="button" slot="button">
            {{ $language.current }}
          </button>
          <a
            v-for="(language, key) in $language.available"
            :key="key"
            class="dropdown-item is-size-5"
            :class="{'is-active': key==$language.current}"
            @click="$language.setCurrent(key)">
            {{ language }}
          </a>
        </dropdown-button>
      </div>
    </div>
  </nav>
</template>

<script>
  import config from '@/js/config';

  export default {

    data() {
      return {
        searchText: '',
        hideSearchInput: true // only on small screen,
      };
    },

    computed: {
      siteConfiguration() {
        return config;
      }
    },

    forumUrl: config.urls.forum,

    created() {
      window.addEventListener('click', this.onClick);
    },

    // do need to destroy event listener as Navigation component will always exists

    methods: {

      go(document) {
        this.$router.push({
          name: this.$documentUtils.getDocumentType(document.type),
          params: { id: document.document_id }
        });
      },

      setUrlsConfiguration(name) {
        config.setUrlsName(name);
        this.$router.go();
      },

      onClick(event) {
        if (!this.$refs.searchInputContainer.contains(event.target)) {
          this.hideSearchInput = true;
        }
      }
    }
  };
</script>

<style scoped lang="scss">

  @import '@/assets/sass/variables.scss';

  nav{
    max-width: 100vw;
    height:$navbar-height;
    background-color: $white;
    box-shadow: 0 2px 0 $color-base-c2c;
    display: flex;
  }

  .navigation-brand{
    padding: 4px 5px!important;
    img{
      height:calc(#{$navbar-height} - 8px);
    }
  }

  .navigation-end{
    justify-content: flex-end;
    margin-left: auto;
    display:flex;
  }

  .navigation-item{
    display:flex;
    align-items: center;
    line-height: 1.5;
  }

  @media screen and (max-width: $tablet) {
    .navigation-brand{

      img{
        margin-left:0px;
        // height:31px;
      }
    }

    .navigation-item{
      padding: 0.5rem 5px;
    }

    .navigation-end{
      margin-right: 5px;
    }

    .search-input{
      width:160px;
    }
  }

  @media screen and (min-width: $tablet) and (max-width: $desktop){
    .navigation-brand{
      img{
        margin-left:5px;
      }
    }

    .navigation-item{
      padding: 0.5rem 5px;
    }

    .navigation-end{
      margin-right: 5px;
    }

    .search-input{
      width:250px;
    }
  }

  @media screen and (min-width: $desktop) and (max-width: $widescreen){
    .navigation-brand{
      img{
        margin-left:20px;
      }
    }

    .navigation-item{
      padding: 0.5rem 0.75rem;
    }

    .navigation-end{
      margin-right: 1rem;
    }
  }

  @media screen and (min-width: $widescreen) and (max-width: $fullhd){
    .navigation-brand{
      img{
        margin-left:20px;
      }
    }

    .navigation-item{
      padding: 0.5rem 0.75rem;
    }

    .navigation-end{
      margin-right: 1rem;
    }
  }

  @media screen and (min-width: $fullhd){
    .navigation-brand{
      img{
        margin-left:20px;
      }
    }

    .navigation-item{
      padding: 0.5rem 0.75rem;
    }

    .navigation-end{
      margin-right: 1rem;
    }
  }

  // search input : increase size to right on hover
  // only on screen wider than desktop
  @media screen and (min-width: $desktop) {

    .search-input{
      width:250px;
      margin-right:50px;
      transition: width .5s ease, margin-right .5s ease;
    }

    .search-input:hover{
      width:300px;
      margin-right:0;
    }
  }
</style>
