<template>
  <section>
    <div class="columns">
      <div class="column is-12-mobile">
        <!-- FORM -->
        <!-- v-show (not v-if): keep the form mounted while loading so its error state survives a failed search -->
        <div class="centered" v-show="view === 'form'">
          <transport-filter-form mode="navigate" @loading="onLoading" @error="onError" />
        </div>
        <!-- LOADING VIEW -->
        <itinevert-loading-view v-show="view === 'loading'" :is-spinner="true"> </itinevert-loading-view>
      </div>
      <div class="column is-3">
        <div class="banner-img" :style="{ backgroundImage: `url(${bannerImage ?? ''})` }"></div>
      </div>
    </div>
  </section>
</template>

<script>
import ItinevertLoadingView from './ItinevertLoadingView.vue';
import TransportFilterForm from './TransportFilterForm.vue';

import { itinevertBanners } from '@/js/asset-urls';

export default {
  name: 'ItinevertWizard',
  components: {
    ItinevertLoadingView,
    TransportFilterForm,
  },
  props: {
    view: {
      type: String,
      default: 'form',
    },
  },
  emits: ['change-view'],

  data() {
    return {
      bannerImage: null,
    };
  },

  async mounted() {
    // handle banner images
    if (itinevertBanners.length) {
      const randomIndex = Math.floor(Math.random() * itinevertBanners.length);
      this.bannerImage = itinevertBanners[randomIndex];
    }

    // reset url parameters
    if (Object.keys(this.$route.query)?.length > 0) {
      this.$router.replace({
        path: this.$route.path,
        query: {},
      });
    }
  },

  methods: {
    /** TransportFilterForm reports its loading state while it resolves the reachable document IDs */
    onLoading(isLoading) {
      this.$emit('change-view', isLoading ? 'loading' : 'form');
    },
    /** On error, TransportFilterForm displays its own message; just go back to the form view to show it */
    onError() {
      this.$emit('change-view', 'form');
    },
  },
};
</script>

<style scoped lang="scss">
.centered {
  margin: auto;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  width: 60%;
}

.banner-img {
  height: 100%;
  width: 100%;
  margin-left: auto;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

@media screen and (max-width: $tablet) {
  .centered {
    margin-left: auto;
    margin-right: auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 90%;
    min-height: 100%;
  }

  .banner-img {
    display: none !important;
  }
}
</style>
