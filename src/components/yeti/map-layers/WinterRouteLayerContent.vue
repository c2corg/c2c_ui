<template>
  <div>
    <div v-if="winterRoutes.length">
      <div v-for="winterRoute in winterRoutes" :key="winterRoute.get('id')" class="pb-2">
        <p class="features-title">
          <span class="features-title-content">{{ winterRoute.get('title') }}</span>
        </p>
        <p class="is-size-7">
          <fa-icon icon="arrow-right" :transform="{ rotate: -45 }" />
          &plus;{{ winterRoute.get('deniv_plus') }}m
          <fa-icon icon="arrow-right" :transform="{ rotate: 45 }" class="pl-4" />
          &minus;{{ winterRoute.get('deniv_minus') }}m
          <fa-icon icon="route" class="pl-4" />
          {{ winterRoute.get('length') }}m
        </p>
      </div>
      <div class="mt-2">
        <button class="button is-primary" @click="addToRoute(winterRoutes)">
          <fa-icon icon="route" class="mr-1" />
          <span v-translate>Add to my outing</span>
        </button>
      </div>
    </div>
    <div v-else>
      <p v-translate>Select one or more winter routes on the map</p>
    </div>
    <toast ref="toast-layer">
      <template #title>
        <span v-translate>Winter routes</span>
      </template>
      <span>
        <strong>{{ winterRoutes.length }}</strong>
        <span v-translate>route(s) added to your outing</span>
      </span>
    </toast>
  </div>
</template>

<script>
import Toast from '@/components/yeti/Toast';
import Yetix from '@/components/yeti/Yetix';

export default {
  components: {
    Toast,
  },
  computed: {
    winterRoutes() {
      return Yetix.winterRoutes.map((winterRoute) => {
        let start = winterRoute.get('start');
        let stop = winterRoute.get('stop');
        let routeTitle = `${this.$gettext('From')} ${start} ${this.$gettext('to')} ${stop}`;

        // swiss route dont have start/stop, but name (based on lang)
        if (!start || !stop) {
          routeTitle = winterRoute.get(`name_${this.$language.current}`) ?? winterRoute.get('name');
        }

        winterRoute.set('title', routeTitle);
        return winterRoute;
      });
    },
  },
  methods: {
    addToRoute(winterRoutes) {
      winterRoutes.forEach((winterRoute) => {
        Yetix.$emit('addFeature', winterRoute);
      });
      if (winterRoutes.length === 1) {
        let winterRoute = winterRoutes[0];
        Yetix.setFeaturesTitle(winterRoute.get('title'));
      }
      Yetix.setWinterRoutes([]);
      Yetix.setActiveTab(2);
      Yetix.setShowWinterRoute(false);

      this.$refs['toast-layer'].toast({ duration: 2000 });
    },
  },
};
</script>
