<template>
  <modal-window ref="modalWindow">
    <template #header>
      <div class="transport-header">
        <span v-if="isLine && data.ref" class="transport-badge" :style="badgeStyle">{{ data.ref }}</span>
        <span>{{ title }}</span>
      </div>
    </template>

    <table class="transport-table">
      <tbody>
        <tr v-if="modeLabel">
          <td v-translate>Type</td>
          <td>{{ modeLabel }}</td>
        </tr>
        <tr v-if="data.network">
          <td v-translate>Network</td>
          <td>{{ data.network }}</td>
        </tr>
        <tr v-if="data.operator">
          <td v-translate>Operator</td>
          <td>{{ data.operator }}</td>
        </tr>
        <tr v-if="isLine && (data.from || data.to)">
          <td v-translate>Route</td>
          <td>{{ [data.from, data.to].filter(Boolean).join(' → ') }}</td>
        </tr>
        <tr v-if="seasonLabel">
          <td v-translate>Season</td>
          <td>{{ seasonLabel }}</td>
        </tr>
        <tr v-if="data.opening_hours">
          <td v-translate>Opening hours</td>
          <td>{{ data.opening_hours }}</td>
        </tr>
        <tr v-if="interval">
          <td v-translate>Frequency</td>
          <td>{{ interval }}</td>
        </tr>
        <tr v-if="serviceLabel">
          <td v-translate>Service</td>
          <td>{{ serviceLabel }}</td>
        </tr>
        <tr v-if="!isLine && lines.length">
          <td v-translate>Lines</td>
          <td>
            <span v-for="line of lines" :key="line" class="transport-line">{{ line }}</span>
          </td>
        </tr>
        <tr v-if="website">
          <td v-translate>Website</td>
          <td>
            <a :href="website" target="_blank" rel="noopener noreferrer">{{ website }}</a>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="openStreetMapUrl" class="transport-source">
      <a :href="openStreetMapUrl" target="_blank" rel="noopener noreferrer" v-translate
        >See and improve this data on OpenStreetMap</a
      >
    </p>
  </modal-window>
</template>

<script>
import { transportLineColour } from './transport-tiles-layer';

import { formatInterval, readableTextColour, safeWebsite, seasonalKind, splitLines } from '@/js/transport-utils';

export default {
  props: {
    // properties of a line or a stop of the transport tiles, see describeTransportFeature
    data: {
      type: Object,
      required: true,
    },
  },

  computed: {
    isLine() {
      return this.data.kind === 'line';
    },

    title() {
      return this.data.name || this.data.ref || '';
    },

    badgeStyle() {
      const background = transportLineColour(this.data);
      return { backgroundColor: background, color: readableTextColour(background) };
    },

    modeLabel() {
      const labels = {
        bus: this.$gettext('Bus', 'Transport mode'),
        trolleybus: this.$gettext('Trolleybus', 'Transport mode'),
        tram: this.$gettext('Tram', 'Transport mode'),
        light_rail: this.$gettext('Light rail', 'Transport mode'),
        subway: this.$gettext('Subway', 'Transport mode'),
        train: this.$gettext('Train', 'Transport mode'),
        monorail: this.$gettext('Monorail', 'Transport mode'),
        funicular: this.$gettext('Funicular', 'Transport mode'),
        ferry: this.$gettext('Ferry', 'Transport mode'),
        aerialway: this.$gettext('Cable car', 'Transport mode'),
      };
      const modes = this.isLine ? [this.data.mode] : splitLines(this.data.modes);
      return modes
        .map((mode) => labels[mode])
        .filter(Boolean)
        .join(', ');
    },

    seasonLabel() {
      return {
        summer: this.$gettext('Summer only', 'Transport season'),
        winter: this.$gettext('Winter only', 'Transport season'),
        both: this.$gettext('Summer and winter', 'Transport season'),
        seasonal: this.$gettext('Seasonal', 'Transport season'),
      }[seasonalKind(this.data.seasonal)];
    },

    interval() {
      return this.data.interval ? formatInterval(this.data.interval) : null;
    },

    serviceLabel() {
      return {
        high_speed: this.$gettext('High speed', 'Transport service'),
        long_distance: this.$gettext('Long distance', 'Transport service'),
        regional: this.$gettext('Regional', 'Transport service'),
        commuter: this.$gettext('Commuter', 'Transport service'),
        night: this.$gettext('Night', 'Transport service'),
        tourism: this.$gettext('Tourism', 'Transport service'),
      }[this.data.service];
    },

    lines() {
      return splitLines(this.data.lines);
    },

    website() {
      return safeWebsite(this.data.website);
    },

    openStreetMapUrl() {
      const relation = String(this.data.rels ?? '').split(',')[0];
      return this.isLine && /^\d+$/.test(relation) ? `https://www.openstreetmap.org/relation/${relation}` : null;
    },
  },

  methods: {
    show() {
      this.$refs.modalWindow.show();
    },
  },
};
</script>

<style scoped lang="scss">
.transport-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6em;
}

.transport-badge,
.transport-line {
  display: inline-block;
  min-width: 2em;
  padding: 0 0.5em;
  border-radius: 1em;
  font-weight: 600;
  text-align: center;
}

.transport-line {
  margin: 0 0.3em 0.3em 0;
  background-color: #e2e8f0;
  color: #1a202c;
}

.transport-table td:first-child {
  padding-right: 1em;
  font-weight: 600;
  white-space: nowrap;
}

.transport-source {
  margin-top: 1em;
  font-size: 0.9em;
}
</style>
