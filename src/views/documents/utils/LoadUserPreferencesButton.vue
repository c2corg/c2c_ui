<template>
  <button
    v-if="$user.isLogged && display === 'button'"
    class="button is-small is-primary header-item"
    :class="{ 'is-loading': promise.loading }"
    @click="loadPreferences"
  >
    <fa-icon icon="star" />
    <span>&nbsp;</span>
    <span v-translate>Load my preferences</span>
  </button>
  <span
    v-else-if="$user.isLogged && display === 'dropdown'"
    class="dropdown-item"
    :class="{ 'is-loading': promise.loading }"
    @click="loadPreferences"
  >
    <fa-icon icon="star" />
    <span v-translate>Load my preferences</span>
  </span>
</template>

<script>
import c2c from '@/js/apis/c2c';

export default {
  props: {
    display: {
      type: String,
      default: 'button',
    },
  },

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
