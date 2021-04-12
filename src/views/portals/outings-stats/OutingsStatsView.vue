<template>
  <div class="section">
    <html-header :title="$gettext('Outings statistics')" />
    <h1 class="title is-3 header-section">
      <span v-translate>Outings statistics</span>
      <span v-if="loadingPercentage !== 1">{{ Math.round(loadingPercentage * 100) }}%</span>
    </h1>

    <query-items v-if="$user.isModerator" class="filter-section" />

    <div class="tabs">
      <ul>
        <li
          v-for="activity of Object.keys(outings)"
          :key="activity"
          :class="{ 'is-active': activeTab === activity }"
          @click="activeTab = activity"
        >
          <a> {{ $gettext(activity, 'activities') }} ({{ outings[activity].length }}) </a>
        </li>
      </ul>
    </div>

    <outings-stats-part v-if="outings[activeTab]" :outings="outings[activeTab]" />
  </div>
</template>

<script>
import OutingsStatsPart from './OutingsStatsPart';

import c2c from '@/js/apis/c2c';
import constants from '@/js/constants';
import QueryItems from '@/views/documents/utils/QueryItems';

const LIST_MAX_LENGTH = 2000;

export default {
  components: {
    OutingsStatsPart,
    QueryItems,
  },

  data() {
    return {
      promise: null,
      outings: {},
      loadingPercentage: 0,
      activeTab: 'all',
    };
  },

  watch: {
    $route: {
      handler: 'load',
      immediate: true,
    },
  },

  methods: {
    load() {
      if (this.promise) {
        this.promise.cancel();
      }
      this.promise = c2c.outing.fullDownload(this.$route.query, LIST_MAX_LENGTH, this.progress).then(this.compute);
    },

    progress(current, total) {
      this.loadingPercentage = current / Math.min(total, LIST_MAX_LENGTH);
    },

    compute(outings) {
      this.promise = null;
      this.outings = { all: outings };

      for (let activity of constants.activities) {
        const result = [];

        for (let outing of outings) {
          if (outing.activities.includes(activity)) {
            result.push(outing);
          }
        }

        if (result.length !== 0) {
          this.outings[activity] = result;
        }
      }
    },
  },
};
</script>

<style scoped lang="scss">
.filter-section {
  padding-bottom: 0.5rem;
  clear: both;
}
</style>
