<template>
  <icon-layer :name="name" :color="color" :selector="layerSelector">
    <span v-translate>FlowCapt sensor</span>
    <template #overlay>
      <a :href="overlay.url" target="_blank">
        {{ overlay.title }}
        <fa-icon icon="external-link-alt" class="overlay-link-icon" />
      </a>
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
      name: 'flowcapt',
      color: 'hsl(112, 55%, 42%)',
      overlay: {
        title: null,
        url: null,
      },
    };
  },
  computed: {
    layerSelector() {
      return {
        title: this.$gettext('FlowCapt sensors'),
        image: 'flowcapt.png',
        small: true,
      };
    },
  },
  methods: {
    setOverlay(feature) {
      this.overlay.title = feature.get('name') + ' - ' + feature.get('city');
      this.overlay.url = feature.get('url');
    },
    unsetOverlay() {
      this.overlay.title = null;
      this.overlay.url = null;
    },
  },
};
</script>
