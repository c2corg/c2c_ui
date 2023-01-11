<template>
  <transition name="fade">
    <div v-show="show" class="offline-notice has-background-grey-dark has-text-white no-print">
      <div class="section is-info has-text-centered">
        <div v-if="showOffline">
          <span>{{ $gettext('Camptocamp is offline.') }}</span>
          <router-link :to="{ name: 'offline' }" v-translate>Show saved documents</router-link>
        </div>
        <div v-else>
          <span>{{ $gettext('Camptocamp is back online.') }}</span>
          <a @click="reloadPage" v-translate>Refresh page</a>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'OfflineNotice',

  data() {
    return {
      isHomePage: false,
      show: false,
      timeoutId: undefined,
      showOffline: true,
    };
  },

  computed: {
    isOffline() {
      return this.$offline.isOffline();
    },
  },

  watch: {
    $route: {
      handler(to) {
        this.isHomePage = to.fullPath === '/';
        if (this.isHomePage) {
          this.clearNotice();
        }
      },
      immediate: true,
    },
    isOffline: 'onlineStatusChanged',
  },

  methods: {
    onlineStatusChanged(offline) {
      this.clearNotice();
      if (this.isHomePage) {
        return; // do not show on homepage
      }

      this.showOffline = offline;
      this.show = true;
      this.timeoutId = setTimeout(() => {
        this.clearNotice();
      }, 5000);
    },

    clearNotice() {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.show = false;
      this.timeoutId = undefined;
    },

    reloadPage() {
      location.reload();
    },
  },
};
</script>

<style lang="css" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
