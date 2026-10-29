<template>
  <section class="section has-text-centered">
    <html-header :title="$gettext('Page not found')" />

    <div class="content">
      <h1 v-translate>Ooops</h1>
      <h3 v-translate>Page not found</h3>

      <p v-translate>The page you are looking for does not exist or is broken.</p>
      <p>
        <a href="javascript:history.go(-1)" v-translate>Go to the previous page</a>
        <span>&nbsp;</span>
        <span v-translate>or try the following pages:</span>
      </p>
    </div>

    <div class="notfound-buttons">
      <router-link
        v-for="(button, i) of buttons"
        :key="i"
        :to="button.to"
        class="is-size-4 has-text-normal has-hover-background has-text-weight-bold"
      >
        <component :is="button.iconComponent || 'fa-icon'" :icon="button.icon" class="has-text-secondary is-size-1" />
        <div>{{ $filters.uppercaseFirstLetter(button.text) }}</div>
      </router-link>
    </div>

    <img class="falling-image" src="@/assets/img/falling.svg" />
  </section>
</template>

<script setup lang="ts">
import { useGlobalProperties } from '@/js/composables/global-properties';
import { useNoRobots } from '@/js/composables/head';

useNoRobots();

const { $gettext } = useGlobalProperties();

// the icons are global components (icon-outing...)
const buildDocumentTypeButton = function (documentType: string, text: string) {
  return {
    to: documentType + 's',
    iconComponent: 'icon-' + documentType,
    icon: undefined,
    text,
  };
};

const buttons = [
  {
    to: { name: 'home' },
    iconComponent: undefined,
    icon: 'home',
    text: $gettext('Home'),
  },
  buildDocumentTypeButton('outing', $gettext('outings')),
  buildDocumentTypeButton('waypoint', $gettext('waypoints')),
  buildDocumentTypeButton('route', $gettext('routes')),
  buildDocumentTypeButton('article', $gettext('articles')),
  buildDocumentTypeButton('book', $gettext('books')),
  buildDocumentTypeButton('xreport', $gettext('xreports')),
  buildDocumentTypeButton('image', $gettext('images')),
  buildDocumentTypeButton('area', $gettext('areas')),
];
</script>

<style scoped lang="scss">
.notfound-buttons {
  display: flex;
  flex-flow: wrap row;
  justify-content: center;
  max-width: 660px;
  margin: auto;

  a {
    width: 33%;
    padding: 20px 0;
    transition: 0.3s;
  }
}

.falling-image {
  transition-property: transform;
  transition-duration: 1s;
}

.falling-image:hover {
  animation-name: rotate;
  animation-duration: 10s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
