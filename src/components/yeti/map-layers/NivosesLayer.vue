<template>
  <icon-layer :name="name" :color="color" :selector="layerSelector">
    <span v-translate>Nivose beacon</span>
    <template #overlay>
      <p class="overlay-title">
        <strong>{{ overlay.title }}</strong> - <em>{{ overlay.massif }}</em>
      </p>
      <div class="overlay-nivoses-icons">
        <a :href="overlay.url1" target="_blank">
          <div class="overlay-nivoses-icons-imgs">
            <img :src="icon" alt="" />
            <fa-icon icon="external-link-alt" class="overlay-link-icon" />
          </div>
          <p>3 <span v-translate>months</span></p>
        </a>
        <a :href="overlay.url2" target="_blank">
          <div class="overlay-nivoses-icons-imgs">
            <img :src="icon" alt="" />
            <fa-icon icon="external-link-alt" class="overlay-link-icon" />
          </div>
          <p>7 <span v-translate>days</span></p>
        </a>
      </div>
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
      name: 'nivoses',
      color: 'hsl(328, 95%, 50%)',
      overlay: {
        title: null,
        massif: null,
        url1: null,
        url2: null,
      },
    };
  },
  computed: {
    layerSelector() {
      return {
        title: this.$gettext('Nivose beacons'),
        image: 'nivose.png',
        small: true,
      };
    },
  },
  created() {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 37" width="50" height="37">
      <path d="m2 2h34v2h-34z" fill-opacity="0.5" />
      <path d="m2 14l4-7 3 5 3-3 4 5 7-8 2 4 2-3 3 6 1-2 2 3 2-4 6 3 6-7 1 3v6h-46z" fill="#fe8f00" />
      <path d="m2 17l4 4 3-3 2 2 3-4 3 4 2-2 6 6-23-0zm37 23l3-3 2 3z" fill="#fe0000" />
      <path d="m48 23l-1 1-3 2-3-3h-2l-4 3-5-1-4-1-3-1z" fill="#0000fe" />
      <path d="m2 33l7-1 9 1h6l2-1 3-3 4-1 4 1 5 1 3-2 3 2v5h-46z" fill="#03c776" />
    </svg>`;
    this.icon = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  },
  methods: {
    setOverlay(feature) {
      this.overlay.title = feature.get('name');
      this.overlay.massif = feature.get('massif');
      this.overlay.url1 = feature.get('url1');
      this.overlay.url2 = feature.get('url2');
    },
    unsetOverlay() {
      this.overlay.title = null;
      this.overlay.massif = null;
      this.overlay.url1 = null;
      this.overlay.url2 = null;
    },
  },
};
</script>

<style scoped lang="scss">
.overlay-title em {
  font-size: 0.9em;
  opacity: 0.8;
}
.overlay-nivoses-icons {
  display: flex;
  justify-content: center;
  margin: 10px;
}
.overlay-nivoses-icons a {
  margin: 0 5px;
  font-size: 0.9em;
  line-height: 1;
}
.overlay-nivoses-icons img {
  border: solid 1px rgba($black, 0.5);
}
.overlay-nivoses-icons-imgs {
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
