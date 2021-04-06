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
        <div>{{ button.text | uppercaseFirstLetter }}</div>
      </router-link>
    </div>

    <img class="falling-image" src="@/assets/img/falling.svg" />
  </section>
</template>

<script>
const buildDocumentTypeButton = function (documentType, text) {
  return {
    to: documentType + 's',
    iconComponent: 'icon-' + documentType,
    text,
  };
};

export default {
  data() {
    return {
      buttons: [
        {
          to: { name: 'home' },
          icon: 'home',
          text: this.$gettext('Home'),
        },
        buildDocumentTypeButton('outing', this.$gettext('outings')),
        buildDocumentTypeButton('waypoint', this.$gettext('waypoints')),
        buildDocumentTypeButton('route', this.$gettext('routes')),
        buildDocumentTypeButton('article', this.$gettext('routes')),
        buildDocumentTypeButton('book', this.$gettext('books')),
        buildDocumentTypeButton('xreport', this.$gettext('xreports')),
        buildDocumentTypeButton('image', this.$gettext('images')),
        buildDocumentTypeButton('area', this.$gettext('areas')),
      ],
    };
  },
};
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
