<template>
  <div>
    <svg :viewBox="danger.altitude ? '0 0 165 100' : '0 0 100 100'" :width="danger.altitude ? 130 : 80" height="80">
      <polygon points="2.2,89.5 97.5,89.5 62.7,11.9 48,32.9 31.8,25.5" />
      <text x="50" :y="danger.high ? 82 : 65">
        <tspan>{{ danger.low }}</tspan>
        <tspan v-if="danger.lowEvol">&ensp;</tspan>
        <tspan v-if="danger.lowEvol">{{ danger.lowEvol }}</tspan>
      </text>
      <g v-if="danger.lowEvol">
        <line x1="45" x2="55" :y1="danger.high ? 75 : 58" :y2="danger.high ? 75 : 58" />
        <line x1="50" x2="55" :y1="danger.high ? 70 : 53" :y2="danger.high ? 75 : 58" />
        <line x1="50" x2="55" :y1="danger.high ? 80 : 63" :y2="danger.high ? 75 : 58" />
      </g>
      <g v-show="danger.high">
        <line x1="10" y1="61.5" x2="90" y2="61.5" />
        <text x="50" y="54">
          <tspan>{{ danger.high }}</tspan>
          <tspan v-if="danger.highEvol">&ensp;</tspan>
          <tspan v-if="danger.highEvol">{{ danger.highEvol }}</tspan>
        </text>
        <g v-if="danger.highEvol">
          <line x1="45" x2="55" y1="46" y2="46" />
          <line x1="50" x2="55" y1="41" y2="46" />
          <line x1="50" x2="55" y1="51" y2="46" />
        </g>
      </g>
      <text v-if="danger.altitude" x="92" y="65" class="small">
        {{ danger.altitude }}
      </text>
    </svg>
  </div>
</template>

<script>
export default {
  props: {
    danger: {
      type: Object,
      required: true,
    },
  },
  computed: {
    locLowIsEast() {
      return this.danger.locLow === 'E';
    },
  },
};
</script>

<style scoped>
line,
polygon {
  fill: none;
  stroke: #000;
  stroke-width: 2;
}
text {
  font-family: sans-serif;
  font-size: 20px;
  font-weight: bold;
  text-anchor: middle;
}
text.small {
  font-size: 16px;
  font-weight: normal;
  text-anchor: start;
}
</style>
