<template>
  <div class="control" :title="value_.join(', ')">
    <svg
      :class="{ 'is-read-only': disabled, 'is-black-white': blackWhite }"
      class="input-orientation is-unselectable"
      xmlns="http://www.w3.org/2000/svg"
      :width="size"
      :height="size"
      version="1.1"
      viewBox="0 0 454.00715 454.00714"
    >
      <g :class="{ 'input-orientation-selected': value_.indexOf('E') > -1 }" @click="toggle('E')">
        <path d="m370.28 168.82-142.14 58.18 142.14 58.185h0.005l83.722-58.185z" />
        <text y="247.58344" x="350" font-size="60">E</text>
      </g>

      <g :class="{ 'input-orientation-selected': value_.indexOf('W') > -1 }" @click="toggle('W')">
        <path d="m83.727 168.82 142.14 58.18-142.14 58.185h-0.0046l-83.725-58.18z" />
        <text y="247.58344" x="56" font-size="60">W</text>
      </g>

      <g :class="{ 'input-orientation-selected': value_.indexOf('S') > -1 }" @click="toggle('S')">
        <path d="m285.19 370.28-58.18-142.14-58.185 142.14v0.005l58.185 83.722z" />
        <text y="390.00714" x="206.10295" font-size="60">S</text>
      </g>

      <g :class="{ 'input-orientation-selected': value_.indexOf('N') > -1 }" @click="toggle('N')">
        <path d="m285.19 83.727-58.18 142.14-58.19-142.14v-0.005l58.19-83.725z" />
        <text y="105.007141" x="205.0424" font-size="60">N</text>
      </g>

      <g :class="{ 'input-orientation-selected': value_.indexOf('SE') > -1 }" @click="toggle('SE')">
        <path d="m369.46 287.17-141.65-59.371 59.368 141.65 0.002 0.002 100.34 18.058z" />
      </g>

      <g :class="{ 'input-orientation-selected': value_.indexOf('NW') > -1 }" @click="toggle('NW')">
        <path d="m166.83 84.55 59.371 141.65-141.65-59.368-0.0032-0.002l-18.058-100.34z" />
      </g>

      <g :class="{ 'input-orientation-selected': value_.indexOf('SW') > -1 }" @click="toggle('SW')">
        <path d="m166.83 369.46 59.371-141.65-141.65 59.368-0.0032 0.002-18.058 100.34z" />
      </g>

      <g :class="{ 'input-orientation-selected': value_.indexOf('NE') > -1 }" @click="toggle('NE')">
        <path d="m369.46 166.83-141.65 59.371 59.368-141.65 0.002-0.002 100.34-18.058z" />
      </g>
    </svg>
  </div>
</template>

<script>
import { arrayMixin, baseMixin } from './mixins';

export default {
  mixins: [baseMixin, arrayMixin],

  props: {
    size: {
      type: Number,
      required: false,
      default: 100,
    },
    blackWhite: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
};
</script>

<style scoped lang="scss">
.input-orientation > g > path {
  fill: #ddd;
  transition: 0.1s;
}

.input-orientation:not(.is-read-only) > g {
  cursor: pointer;
}

.input-orientation > g.input-orientation-selected > path {
  fill: $primary;
  transition: 0.1s;
}

.input-orientation.is-black-white > g.input-orientation-selected > path {
  fill: $black;
  transition: 0.1s;
}

.input-orientation > g.input-orientation-selected > text {
  fill: $white;
  transition: 0.1s;
}

@media print {
  .input-orientation {
    display: none;
  }

  div:before {
    content: 'Orientations : ';
    font-weight: 700;
  }

  div:after {
    content: attr(title);
  }
}
</style>
