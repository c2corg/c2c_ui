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

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import ItinevertLoadingView from './ItinevertLoadingView.vue';
import TransportFilterForm from './TransportFilterForm.vue';

import { itinevertBanners } from '@/js/asset-urls';

defineProps({
  view: {
    type: String,
    default: 'form',
  },
});

const emit = defineEmits(['change-view']);

const route = useRoute();
const router = useRouter();

const bannerImage = ref<string | null>(null);

/** TransportFilterForm reports its loading state while it checks the search */
function onLoading(isLoading: boolean) {
  emit('change-view', isLoading ? 'loading' : 'form');
}

/** On error, TransportFilterForm displays its own message: back to the form view to show it */
function onError() {
  emit('change-view', 'form');
}

onMounted(() => {
  // handle banner images
  if (itinevertBanners.length) {
    const randomIndex = Math.floor(Math.random() * itinevertBanners.length);
    bannerImage.value = itinevertBanners[randomIndex];
  }

  // reset url parameters
  if (Object.keys(route.query).length > 0) {
    router.replace({ path: route.path, query: {} });
  }
});
</script>

<style scoped>
@import '@/assets/css/media.css';

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

@media screen and (--c2c-max-tablet) {
  .centered {
    margin-left: auto;
    margin-right: auto;
    width: 90%;
    min-height: 100%;
  }

  .banner-img {
    display: none !important;
  }
}
</style>
