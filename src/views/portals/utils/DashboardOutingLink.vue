<template>
  <dashboard-link :document="outing">
    <span class="outing-icons is-grid" :class="nbIconsClass">
      <marker-quality :quality="outing.quality" />
      <marker-soft-mobility v-if="outing.public_transport" />
      <marker-condition :condition="outing.condition_rating" />
      <marker-gps-trace v-if="outing.geometry.has_geom_detail" />
      <marker-image-count :image-count="outing.img_count" />
    </span>
  </dashboard-link>
</template>

<script>
import DashboardLink from './DashboardLink';

export default {
  components: { DashboardLink },

  props: {
    outing: {
      type: Object,
      required: true,
    },
  },

  computed: {
    nbIconsClass() {
      let result = 0;

      if (this.outing.img_count > 0) {
        result = result + 1;
      }
      if (this.outing.public_transport) {
        result = result + 1;
      }
      if (this.outing.geometry.has_geom_detail) {
        result = result + 1;
      }
      if (this.outing.quality !== null) {
        result = result + 1;
      }
      if (this.outing.condition_rating !== null) {
        result = result + 1;
      }

      return 'is-' + result + '-icons';
    },
  },
};
</script>

<style scoped lang="scss">
.is-grid {
  display: grid;
  direction: rtl;
}

.is-1-icons {
  grid-template-columns: repeat(1, 1fr);
}

.is-2-icons {
  grid-template-columns: repeat(2, 1fr);
}

.is-3-icons {
  grid-template-columns: repeat(3, 1fr);
}

.is-4-icons {
  grid-template-columns: repeat(4, 1fr);
}

.is-5-icons {
  grid-template-columns: repeat(5, 1fr);
}

@media screen and (max-width: $tablet) {
  .is-2-icons,
  .is-3-icons,
  .is-4-icons {
    grid-template-columns: repeat(2, 1fr);
  }

  .is-5-icons {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>

<style lang="scss">
.outing-icons.is-grid span {
  padding: 0.1rem;
}
</style>
