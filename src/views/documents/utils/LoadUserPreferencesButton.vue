<template>
  <button
    v-if="$user.isLogged"
    class="button is-small is-primary header-item"
    :class="{ 'is-loading': promise.loading }"
    @click="loadPreferences"
  >
    <fa-icon icon="star" />
    <span class="is-hidden-mobile">&nbsp;</span>
    <span class="is-hidden-mobile" v-translate>
      Load my preferences
    </span>
  </button>
</template>

<script>
import c2c from '@/js/apis/c2c';

export default {
  data() {
    return {
      promise: {},
    };
  },

  computed: {
    documentType() {
      return this.$route.name.slice(0, -1);
    },
  },

  methods: {
    loadPreferences() {
      this.promise = c2c.userProfile.preferences.get().then((result) => {
        const preferences = result.data;
        const query = Object.assign({}, this.$route.query);

        if (['outing', 'route', 'image', 'xreport', 'books', 'articles'].includes(this.documentType)) {
          const activities = preferences.activities.join(',');
          query.act = activities === '' ? undefined : activities;
        }

        if (['outing', 'route', 'image', 'xreport', 'waypoint'].includes(this.documentType)) {
          const areas = preferences.areas.map((area) => area.document_id).join(',');
          query.a = areas === '' ? undefined : areas;
          query.bbox = undefined;
        }

        this.$router.push({ query });
      });
    },
  },
};
</script>
