<template>
  <div class="card" :class="{ 'has-background-light': application.status === 'not-configured' }">
    <div class="card-content">
      <div class="media">
        <div class="media-left">
          <figure class="image is-48x48">
            <img
              :src="require(`@/assets/img/tracking/${application.name}.png`)"
              :alt="$gettext(application.name)"
              class="rounded"
              :class="{ 'grayed-out': application.status === 'not-configured' }"
            />
          </figure>
        </div>
        <div class="media-content">
          <p class="is-4 has-text-weight-bold">{{ $gettext(application.name) }}</p>
          <a :href="application.website" class="is-6" target="_blank" v-translate>Go to website</a>
          <span
            class="status is-size-1"
            :class="application.status === 'configured' ? 'has-text-success' : 'has-text-warning'"
            :title="$gettext('Configured')"
            v-if="application.status !== 'not-configured'"
            >{{ application.status === 'configured' ? '✔' : '⚠' }}</span
          >
        </div>
      </div>
    </div>
    <footer class="card-footer">
      <a @click="configure()" class="card-footer-item" v-if="canConnect">
        <fa-icon icon="plug"></fa-icon>&nbsp;{{ $gettext('Connect') }}
      </a>
      <a @click="configure()" class="card-footer-item" v-if="canRefresh">
        <fa-icon icon="rotate"></fa-icon>&nbsp;{{ $gettext('Refresh') }}
      </a>
      <a @click="revoke()" class="card-footer-item" v-if="canRevoke">
        <fa-icon icon="trash"></fa-icon>&nbsp;{{ $gettext('Revoke') }}
      </a>
    </footer>
  </div>
</template>

<script>
export default {
  props: {
    application: {
      type: Object,
      required: true,
    },
  },

  computed: {
    canRefresh() {
      return this.application.status !== 'not-configured';
    },

    canConnect() {
      return this.application.status === 'not-configured';
    },

    canRevoke() {
      return this.application.status !== 'not-configured';
    },
  },

  methods: {
    revoke() {
      this.$emit('revoke');
    },

    configure() {
      this.$emit('configure');
    },
  },
};
</script>

<style scoped lang="scss">
.rounded {
  border-radius: 6px;
}

.grayed-out {
  filter: grayscale(0.8);
}
.status {
  position: absolute;
  top: 20px;
  right: 30px;
  cursor: help;
}
</style>
