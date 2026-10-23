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

    <section v-if="canLoad" class="transport-schedule">
      <div class="transport-day">
        <button class="button is-small" type="button" :title="$gettext('Previous day')" @click="shiftDay(-1)">
          <fa-icon icon="chevron-left" />
        </button>
        <strong class="transport-day-label">{{ dayLabel }}</strong>
        <button class="button is-small" type="button" :title="$gettext('Next day')" @click="shiftDay(1)">
          <fa-icon icon="chevron-right" />
        </button>
      </div>

      <p v-if="loading" class="transport-message" v-translate>Loading...</p>
      <p v-else-if="error" class="transport-message has-text-danger">{{ error }}</p>
      <template v-else-if="schedule">
        <p v-if="!hasService" class="transport-message">
          <span v-translate>No service this day.</span>
          <a v-if="schedule.next_date" href="#" @click.prevent="goTo(schedule.next_date)">
            {{ $gettext('Next service:') }} {{ formatDay(schedule.next_date) }}
          </a>
        </p>

        <ul v-if="!isLine" class="transport-departures">
          <li v-for="line of schedule.lines" :key="line.route_id || line.line_id">
            <div class="transport-departures-line">
              <span class="transport-badge" :style="navitiaLineStyle(line)">{{ line.code }}</span>
              <span>{{ line.direction }}</span>
            </div>
            <div class="transport-times">
              <span v-for="time of line.departures" :key="time" class="transport-time">{{ time }}</span>
              <em v-if="!line.departures.length" v-translate>No service this day.</em>
            </div>
          </li>
        </ul>

        <template v-else>
          <div v-for="(direction, index) of schedule.directions" :key="index" class="transport-direction">
            <h4 v-if="direction.direction">→ {{ direction.direction }}</h4>
            <div v-if="direction.trips.length" class="transport-trips-scroll">
              <table class="transport-trips">
                <tbody>
                  <tr v-for="(stop, stopIndex) of direction.stops" :key="stop.id || stopIndex">
                    <th scope="row">{{ stop.name }}</th>
                    <td v-for="(trip, tripIndex) of direction.trips" :key="tripIndex">{{ trip[stopIndex] || '' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <div v-if="visibleSections.length" class="transport-linked">
          <div v-for="section of visibleSections" :key="section.key">
            <h4>{{ section.title }}</h4>
            <ul>
              <li v-for="item of section.items" :key="item.document_id">
                <router-link :to="documentLink(section.type, item.document_id)">
                  {{ item.title || '#' + item.document_id }}
                </router-link>
                <small v-if="item.distance !== undefined"> · {{ item.distance }} km</small>
                <small v-if="item.date_end"> · {{ item.date_end }}</small>
              </li>
            </ul>
          </div>
        </div>
      </template>

      <p class="transport-source">
        <span v-translate>Planned timetable, from Navitia.</span>
      </p>
    </section>

    <p v-if="openStreetMapUrl" class="transport-source">
      <a :href="openStreetMapUrl" target="_blank" rel="noopener noreferrer" v-translate
        >See and improve this data on OpenStreetMap</a
      >
    </p>
  </modal-window>
</template>

<script>
import { transportLineColour } from './transport-tiles-layer';

import transportService from '@/js/apis/transport-service';
import {
  addDays,
  formatDay,
  formatInterval,
  isoDate,
  normalizeColour,
  readableTextColour,
  safeWebsite,
  seasonalKind,
  splitLines,
} from '@/js/transport-utils';

export default {
  props: {
    // a line or a stop of the transport tiles, see describeTransportFeature
    data: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      date: isoDate(new Date()),
      loading: false,
      error: null,
      schedule: null,
      // to ignore the answer of a request that is no longer the last one
      requestId: 0,
    };
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

    // a line is looked for by its number, which not all of them have
    canLoad() {
      return Number.isFinite(this.data.lon) && Number.isFinite(this.data.lat) && (!this.isLine || !!this.data.ref);
    },

    dayLabel() {
      return formatDay(this.date, this.$language.current);
    },

    hasService() {
      if (!this.schedule) {
        return false;
      }
      return this.isLine
        ? this.schedule.directions.some((direction) => direction.trips.length)
        : this.schedule.lines.some((line) => line.departures.length);
    },

    linkedSections() {
      const linked = this.schedule?.associations ?? {};
      return [
        { key: 'waypoints', type: 'w', title: this.$gettext('Waypoints near a stop'), items: linked.waypoints ?? [] },
        { key: 'routes', type: 'r', title: this.$gettext('Routes you can reach'), items: linked.routes ?? [] },
        { key: 'outings', type: 'o', title: this.$gettext('Recent outings'), items: linked.outings ?? [] },
      ];
    },

    visibleSections() {
      return this.linkedSections.filter((section) => section.items.length);
    },
  },

  methods: {
    show() {
      this.date = isoDate(new Date());
      this.schedule = null;
      this.error = null;
      this.$refs.modalWindow.show();
      this.load();
    },

    shiftDay(days) {
      this.date = addDays(this.date, days);
      this.load();
    },

    goTo(day) {
      this.date = day;
      this.load();
    },

    formatDay(day) {
      return formatDay(day, this.$language.current);
    },

    navitiaLineStyle(line) {
      const background = normalizeColour(line.color ? '#' + line.color : '', '#4a5568');
      const text = normalizeColour(line.text_color ? '#' + line.text_color : '', readableTextColour(background));
      return { backgroundColor: background, color: text };
    },

    documentLink(type, id) {
      return { name: this.$documentUtils.getDocumentType(type), params: { id } };
    },

    errorMessage(error) {
      switch (error?.response?.status) {
        case 404:
          return this.isLine
            ? this.$gettext('This line is not in the timetables.')
            : this.$gettext('This stop is not in the timetables.');
        case 429:
          return this.$gettext('Too many requests, please try again in a moment.');
        default:
          return this.$gettext('The timetable is not available right now.');
      }
    },

    async load() {
      if (!this.canLoad) {
        return;
      }
      const requestId = ++this.requestId;
      this.loading = true;
      this.error = null;
      try {
        const { lon, lat } = this.data;
        const lang = this.$language.current;
        const schedule = this.isLine
          ? await transportService.getLineSchedules({
              lon,
              lat,
              date: this.date,
              ref: this.data.ref,
              network: this.data.network,
              lang,
            })
          : await transportService.getStopSchedules({
              lon,
              lat,
              date: this.date,
              navitiaId: this.data.navitia_id,
              name: this.data.name,
              lang,
            });
        if (requestId === this.requestId) {
          this.schedule = schedule;
        }
      } catch (error) {
        if (requestId === this.requestId) {
          this.schedule = null;
          this.error = this.errorMessage(error);
        }
      } finally {
        if (requestId === this.requestId) {
          this.loading = false;
        }
      }
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

.transport-schedule {
  margin-top: 1em;
  padding-top: 0.8em;
  border-top: 1px solid #e2e8f0;
}

.transport-day {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1em;
  margin-bottom: 0.8em;
}

.transport-day-label {
  min-width: 11em;
  text-align: center;
  text-transform: capitalize;
}

.transport-message {
  margin-bottom: 0.8em;
  text-align: center;

  a {
    display: block;
  }
}

.transport-departures {
  list-style: none;
  margin: 0;
  padding: 0;

  > li {
    margin-bottom: 0.8em;
  }
}

.transport-departures-line {
  display: flex;
  align-items: center;
  gap: 0.6em;
  margin-bottom: 0.3em;
}

.transport-times {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3em;
}

.transport-time {
  padding: 0 0.4em;
  border-radius: 3px;
  background-color: #edf2f7;
  font-variant-numeric: tabular-nums;
}

.transport-direction h4 {
  margin: 0.8em 0 0.3em;
  font-weight: 600;
}

.transport-trips-scroll {
  max-width: 100%;
  overflow-x: auto;
}

.transport-trips {
  border-collapse: collapse;
  font-size: 0.9em;
  font-variant-numeric: tabular-nums;

  th {
    position: sticky;
    left: 0;
    padding-right: 0.8em;
    background-color: #fff;
    font-weight: 400;
    text-align: left;
    white-space: nowrap;
  }

  td {
    padding: 0 0.5em;
    text-align: center;
  }

  tr:nth-child(even) > * {
    background-color: #f7fafc;
  }
}

.transport-linked {
  margin-top: 1em;

  h4 {
    margin: 0.8em 0 0.2em;
    font-weight: 600;
  }

  ul {
    margin: 0;
    padding-left: 1.2em;
  }
}

.transport-source {
  margin-top: 1em;
  font-size: 0.9em;
}
</style>
