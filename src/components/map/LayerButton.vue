<template>
  <div
    class="layer-button"
    @click="$emit('click')"
    :style="{
      'background-image': 'url(' + require('../../assets/img/layers/' + (layer.image || layer.get('image'))) + ')',
    }"
  >
    <span class="layer-button-title">{{ $gettext(layer.title || layer.get?.('title'), titleContext) }}</span>
    <div
      class="layer-button-country"
      v-if="country"
      :style="{ 'background-image': 'url(' + require('../../assets/img/flags/' + country + '.svg') + ')' }"
    ></div>
    <div class="layer-button-border" v-if="selected"></div>
  </div>
</template>

<script>
export default {
  name: 'LayerButton',

  props: {
    layer: {
      type: Object,
      required: true,
    },
    titleContext: {
      type: String,
      default: undefined,
    },
    selected: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    country() {
      return this.layer.country || this.layer.get?.('country');
    },
  },
};
</script>

<style scope lang="scss">
$button-width: 78px;
$button-radius: 5px;

.layer-button {
  position: relative;
  width: $button-width;
  height: $button-width;
  margin: 10px;
  cursor: pointer;
  border-radius: $button-radius;
  padding: 5px;
  vertical-align: bottom;

  &:hover {
    filter: brightness(80%);
  }
}

.layer-button-border {
  position: absolute;
  top: 0;
  left: 0;
  width: $button-width;
  height: $button-width;
  border-radius: 5px;
  border: 3px solid #fff;
}

.layer-button-title {
  position: absolute;
  padding-bottom: 2px;
  bottom: 0;
  left: 0;
  width: $button-width;
  border-bottom-left-radius: $button-radius;
  border-bottom-right-radius: $button-radius;
  font-size: 0.8em;
  text-align: center;
  background-color: rgba($color: #000, $alpha: 0.5);
}

.layer-button-country {
  width: 20px;
  height: 15px;
  background-size: contain;
  border-radius: 2px;
}
</style>
