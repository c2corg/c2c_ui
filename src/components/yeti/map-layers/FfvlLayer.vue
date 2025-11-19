<template>
  <icon-layer :name="name" :color="color" :selector="layerSelector">
    <span v-translate>FFVL</span>
    <template #overlay>
      <p class="overlay-title">
        <a :href="overlay.url" target="_blank">
          {{ overlay.title }}
          <fa-icon icon="external-link-alt" />
        </a>
      </p>
      <div class="overlay-icons">
        <a :href="overlay.urlHisto" target="_blank">
          <div class="overlay-icons-imgs">
            <img :src="iconHisto" alt="" />
            <fa-icon icon="external-link-alt" class="overlay-link-icon" />
          </div>
          <p v-translate translate-context="yeti">History</p>
        </a>
      </div>
      <p class="footer is-size-7 has-text-left py-1 px-3">
        <a href="https://balisemeteo.com" target="_blank">©balisemeteo.com</a>
      </p>
    </template>
  </icon-layer>
</template>

<script>
import IconLayer from './IconLayer.vue';
import getIconLayerMixin from './getIconLayer';

export default {
  components: {
    IconLayer,
  },
  mixins: [getIconLayerMixin],
  data() {
    return {
      name: 'ffvl',
      color: 'red',
      colorExpired: 'lightgray',
      overlay: {
        title: null,
        url: null,
      },
    };
  },
  computed: {
    layerSelector() {
      return {
        title: this.$gettext('FF Vol Libre'),
        image: 'ffvl.png',
        small: true,
      };
    },
  },
  created() {
    this.createIcon = () => {
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">
        <defs>
          <linearGradient id="g1">
            <stop offset="0" stop-color="#f00"/>
            <stop offset=".25" stop-color="#f00"/>
            <stop offset=".25" stop-color="#fff"/>
            <stop offset=".38" stop-color="#fff"/>
            <stop offset=".38" stop-color="#f00"/>
            <stop offset=".62" stop-color="#f00"/>
            <stop offset=".62" stop-color="#fff"/>
            <stop offset=".74" stop-color="#fff"/>
            <stop offset=".74" stop-color="#f00"/>
            <stop offset="1" stop-color="#f00"/>
          </linearGradient>
        </defs>
        <path d="m2 8q0-0.8 0.4-1.5 0.4-0.7 1.1-1.1 0.7-0.4 1.5-0.4 0.8 0 1.5 0.4l16.5 3.8q0.7 0.4 1.1 1.1 0.4 0.7 0.4 1.5c0 0.5-0.1 3.1-0.4 3.5q-0.4 0.7-1.1 1.1l-16.5 3.8q-0.7 0.4-1.5 0.4-0.8 0-1.5-0.4-0.7-0.4-1.1-1.1-0.4-0.7-0.4-1.5z" stroke="black" stroke-width="1.25" fill="url(#g1)"/>
        </svg>`;
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    };
    this.iconSrc = this.createIcon(this.color);
    this.iconCardSrc = this.createIcon(this.color);

    let svgHisto = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 37" width="50" height="37">
      <path d="m2 2h2v33h-2z" fill-opacity="0.5" />
      <path d="m6 33l3-2 3-6 5 2 3 5 3-3 6-3 6 2 3 3 4 1h6" fill="none" stroke="hsl(153deg, 68%, 60%)" stroke-width="2" />
      <path d="m6 25l3-3 2-8 2-2 2 7 4 3 2-5 6-2 1 6 3-1 2-4 7 8 8 1" fill="none" stroke="hsl(210deg, 85%, 65%)" stroke-width="2" />
      <path d="m7 16l2-9 2-4 7 3 3 4h6l5-2 7 6 9 3" fill="none" stroke="hsl(330deg, 82%, 70%)" stroke-width="2" />
    </svg>`;
    this.iconHisto = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgHisto);
  },
  methods: {
    setOverlay(feature) {
      this.overlay.title = feature.get('name');
      this.overlay.url = feature.get('url');
      this.overlay.urlHisto = feature.get('url_histo');
    },
    unsetOverlay() {
      this.overlay.title = null;
      this.overlay.url = null;
      this.overlay.urlHisto = null;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.footer {
  background: $grey-lighter;
  margin: 10px -5px -5px;
}
.overlay-icons {
  display: flex;
  justify-content: center;
  margin: 10px;
}
.overlay-icons a {
  margin: 0 5px;
  font-size: 0.9em;
  line-height: 1;
}
.overlay-icons img {
  border: solid 1px rgba($black, 0.5);
}
.overlay-icons-imgs {
  position: relative;
}
.overlay-link-icon {
  position: absolute;
  top: 1px;
  right: 1px;
  background: white;
  padding: 2px;
}
</style>
