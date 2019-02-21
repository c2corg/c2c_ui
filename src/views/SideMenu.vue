<template>
  <aside class="no-print">
    <router-link
      v-for="item of menuItems"
      :key="item.name"
      :to="{name:item.name, query: item.query}"
      class="menu-item is-ellipsed"
      :class="{'router-link-active':item.activeFor.includes($route.name)}">
      <component :is="item.icon" />
      <span class="menu-item-text"> {{ item.text | uppercaseFirstLetter }} </span>
    </router-link>

    <div class="menu-footer is-size-7">
      <advertisement class="menu-add" v-if="windowHeight>=654"/>

      <div class="has-text-centered menu-links">
        <router-link :to="{name:'article', params:{id:106727}}" v-translate>contact</router-link>
        <span> &bull; </span>
        <router-link :to="{name:'article', params:{id:106731}}" v-translate>EULA</router-link>
        <span> &bull; </span>
        <router-link :to="{name:'article', params:{id:106728}}" v-translate>Licenses</router-link>
        <br>
        <router-link :to="{name:'article', params:{id:106726}}" v-translate>Association</router-link>
      </div>

      <div class="columns is-gapless has-text-centered is-mobile menu-socials">
        <div class="column">
          <a href="https://twitter.com/camptocamporg" title="twitter">
            <fa-icon :icon="['fab', 'twitter']" class="twitter-icon"/>
          </a>
        </div>
        <div class="column">
          <a href="https://www.facebook.com/camptocamp.org/" title="facebook">
            <fa-icon :icon="['fab', 'facebook']" class="facebook-icon"/>
          </a>
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
  import Advertisement from './Advertisement';

  export default {
    components: { Advertisement },

    data() {
      return {
        windowHeight: 0
      };
    },

    computed: {
      // This must be computed, because it needs $gettext() function
      menuItems() {
        return [
          { name: 'topoguide', icon: 'icon-topoguide', text: this.$gettext('Topoguide'), activeFor: ['routes', 'waypoints', 'route', 'waypoint', 'area', 'areas'] },
          { name: 'outings', icon: 'icon-outing', text: this.$gettext('outings'), activeFor: ['outing'], query: { qa: 'draft,great', bbox: '-431698,3115462,1931123,8442818' } },
          { name: 'forum', icon: 'icon-forum', text: this.$gettext('Forum'), activeFor: [] },
          { name: 'serac', icon: 'icon-xreport', text: this.$gettext('Accident database'), activeFor: ['xreports', 'xreport', 'xreport-add'] },
          { name: 'articles', icon: 'icon-article', text: this.$gettext('articles'), activeFor: ['article'] }
        ];
      }
    },

    mounted() {
      this.onResize();
      window.addEventListener('resize', this.onResize);
    },

    methods: {
      onResize() {
        this.windowHeight = window.innerHeight;
      }
    }
  };
</script>

<style scoped lang="scss">
  @import '@/assets/sass/variables.scss';

  aside{
    box-shadow: 0 1px 4px 0 rgba(0,0,0,.2);
    background: $white;
  }

  .menu-item{
    display: block;
    height: 37px;
    // border-top: 1px solid #ccc;
    padding: 8px 10px;
    border-left:5px solid $white;
    color:$grey-dark;
  }

  .menu-item:hover{
    background:$light;
    border-left:5px solid $color-base-c2c-lighter;
  }

  .menu-item-text{
    margin-left: 0;
    font-size:1.1rem;
  }

  .menu-item.router-link-active{
    border-left:5px solid $color-base-c2c;
    font-weight: bold;
  }

  .menu-footer{
    position: absolute;
    width:100%;
    bottom: 0;

    .menu-socials, .menu-add, .menu-links {
      margin-bottom: 15px!important;
      line-height: 1;
    }

    .menu-add{
      height: 320px;
      margin-left: calc((200px - 160px)/2);
      margin-right: calc((200px - 160px)/2);
    }

    .twitter-icon, .facebook-icon{
      font-size: 30px;
    }

    .twitter-icon, .twitter-icon:hover{
      color:#4198fb; // twitter color
    }

    .facebook-icon, .facebook-icon:hover{
      color:#6d8bc9; //facebook color
    }
  }

  // @media screen and (max-height: 645px){
  //     .menu-add{
  //         display:none!important;
  //     }
  // }

  @media screen and (max-height: 340px){
    .menu-socials{
      display:none!important;
    }
  }

</style>
