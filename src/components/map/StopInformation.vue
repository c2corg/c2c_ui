<template>
  <modal-window ref="modalWindow">
    <template #header>
      <div class="has-text-centered">
        <router-link v-if="nearestWaypoint" :to="waypointRoute(nearestWaypoint)" custom v-slot="{ href, navigate }">
          <a :href="href" @click="goTo($event, navigate)">{{ data.stoparea_name }}</a>
        </router-link>
        <span v-else>{{ data.stoparea_name }}</span>
      </div>
    </template>

    <p v-for="line of data.lines" :key="line.id" class="stop-line">
      <strong v-translate>Line</strong> : {{ line.line }}
      <template v-if="line.operator">
        <br />
        <strong v-translate>Operator</strong> : {{ line.operator }}
      </template>
    </p>

    <template v-if="data.waypoints && data.waypoints.length">
      <hr />
      <p v-translate>Close to:</p>
      <ul>
        <li v-for="waypoint of data.waypoints" :key="waypoint.document_id">
          <router-link :to="waypointRoute(waypoint)" custom v-slot="{ href, navigate }">
            <a :href="href" @click="goTo($event, navigate)">{{ waypointTitle(waypoint) }}</a>
          </router-link>
          <small> ({{ waypoint.distance }} km)</small>
        </li>
      </ul>
    </template>
  </modal-window>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      required: true,
    },
  },

  computed: {
    // waypoints are sorted by distance, the first one is the nearest
    nearestWaypoint() {
      return this.data.waypoints?.[0];
    },
  },

  methods: {
    show() {
      this.$refs.modalWindow.show();
    },

    hide() {
      this.$refs.modalWindow.hide();
    },

    // let the router handle the click (modifier keys included), then close the modal
    goTo(event, navigate) {
      navigate(event);
      this.hide();
    },

    waypointRoute(waypoint) {
      return { name: 'waypoint', params: { id: waypoint.document_id } };
    },

    waypointTitle(waypoint) {
      return this.$documentUtils.getDocumentTitle({ type: 'w', locales: waypoint.locales });
    },
  },
};
</script>

<style scoped lang="scss">
.stop-line {
  margin-bottom: 0.5rem;
}
</style>
