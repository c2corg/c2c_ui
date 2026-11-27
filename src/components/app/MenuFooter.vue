<template>
  <div class="menu-footer" :class="touch ? 'is-size-6 is-touch' : 'is-size-7'">
    <div class="has-text-centered menu-links">
      <router-link :to="{ name: 'article', params: { id: 106727 } }" v-translate>contact</router-link>
      <span> &bull; </span>
      <router-link :to="{ name: 'article', params: { id: 106731 } }" v-translate>EULA</router-link>
      <span> &bull; </span>
      <router-link :to="{ name: 'article', params: { id: 106728 } }" v-translate>Licenses</router-link>
      <br />
      <router-link :to="{ name: 'article', params: { id: 106726 } }" v-translate>Association</router-link>
      <span> &bull; </span>
      <button type="button" class="link-button" @click="showGdpr" v-translate>Cookies</button>
    </div>

    <div class="columns is-gapless has-text-centered is-mobile menu-socials">
      <div class="column">
        <a href="https://www.instagram.com/camptocamp_org/" title="Instagram">
          <icon-instagram class="instagram-icon" />
        </a>
      </div>
      <div class="column">
        <a href="https://www.facebook.com/camptocamp.org/" title="Facebook">
          <fa-icon :icon="['fab', 'facebook']" class="facebook-icon" />
        </a>
      </div>
      <div class="column">
        <a href="https://www.youtube.com/channel/UCllJ4-Ab7A0ZoqlAOAJtnCw" :title="$gettext('Youtube')">
          <fa-icon :icon="['fab', 'youtube']" class="youtube-icon" />
        </a>
      </div>
      <div class="column">
        <a href="https://www.helloasso.com/associations/camptocamp-association" :title="$gettext('Donate')">
          <fa-icon icon="heart" class="donate-icon" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import bus from '@/js/event-bus';

defineOptions({ name: 'MenuFooter' });

defineProps<{
  // links and icons big enough for a finger
  touch?: boolean;
}>();

// the legal links and the social networks of the site, at the end of the side menu and of the menu page of the phone layout
function showGdpr() {
  bus.emit('show-gdpr');
}
</script>

<style scoped>
.menu-links,
.menu-socials {
  margin-bottom: 15px !important;
  line-height: 1;
}

.instagram-icon,
.facebook-icon,
.donate-icon,
.youtube-icon {
  font-size: 30px;
}

.facebook-icon {
  color: #6d8bc9; /* facebook color */
}

.youtube-icon {
  color: #f00; /* youtube color */
}

.donate-icon {
  color: hsl(348, 100%, 71%);
  &:hover {
    color: hsl(348, 100%, 51%);
  }
}

/* for a finger: each link is a target of at least 44 px */
.is-touch {
  .menu-links a,
  .menu-links .link-button {
    display: inline-block;
    min-height: 44px;
    padding: 12px 10px;
    line-height: 20px;
  }

  .menu-socials a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 48px;
    min-height: 48px;
  }
}
</style>
