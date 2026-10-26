<template>
  <modal-window ref="modalWindow">
    <template #header>
      <div class="transport-header">
        <transport-badge v-if="isLine && data.ref" :label="data.ref" :mode="data.mode" :colour="lineColour" />
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
      <transport-day-navigation :model-value="date" @update:model-value="goTo" />

      <p v-if="loading" class="transport-message" v-translate>Loading...</p>
      <p v-else-if="error" class="transport-message has-text-danger">{{ error }}</p>
      <template v-else-if="schedule">
        <p v-if="!hasService" class="transport-message">
          <span v-translate>No service this day.</span>
          <a v-if="schedule.next_date" href="#" @click.prevent="goTo(schedule.next_date)">
            {{ $gettext('Next service:') }} {{ formatDay(schedule.next_date) }}
          </a>
        </p>

        <div v-if="!isLine && schedule.lines.length" class="transport-scroll">
          <table class="transport-departures">
            <thead>
              <tr>
                <th v-translate>Line</th>
                <th v-translate>Direction</th>
                <th v-translate>Departures</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line of schedule.lines" :key="line.route_id || line.line_id">
                <td>
                  <transport-badge :label="line.code || ''" :mode="mode(line)" :colour="navitiaColour(line)" />
                </td>
                <td>{{ line.direction }}</td>
                <td>
                  <span
                    v-for="time of line.departures"
                    :key="time"
                    class="transport-time"
                    :class="{ 'is-on-demand': isOnDemand(line, time) }"
                    :title="isOnDemand(line, time) ? $gettext('On demand') : null"
                    >{{ time }}</span
                  >
                  <em v-if="!line.departures.length">–</em>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <template v-if="isLine">
          <div v-for="(direction, index) of schedule.directions" :key="index" class="transport-direction">
            <h4 v-if="direction.direction">→ {{ direction.direction }}</h4>
            <div v-if="direction.trips.length" class="transport-scroll">
              <table class="transport-trips">
                <thead v-if="direction.trips.some((trip) => trip.on_demand)">
                  <tr>
                    <td></td>
                    <td v-for="(trip, tripIndex) of direction.trips" :key="tripIndex">
                      <small v-if="trip.on_demand" class="transport-on-demand" v-translate>On demand</small>
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(stop, stopIndex) of direction.stops" :key="stop.id || stopIndex">
                    <th scope="row">{{ stop.name }}</th>
                    <td v-for="(trip, tripIndex) of direction.trips" :key="tripIndex">
                      {{ trip.times[stopIndex] || '' }}
                    </td>
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
            <router-link v-if="section.all" :to="section.all" class="transport-all">{{ section.allLabel }}</router-link>
          </div>
        </div>
      </template>

      <p v-if="hasOnDemand" class="transport-source">
        <span v-translate>On-demand trips usually have to be booked beforehand: check with the operator.</span>
      </p>
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
import TransportBadge from './TransportBadge';
import TransportDayNavigation from './TransportDayNavigation';
import { transportLineColour } from './transport-tiles-layer';

import transportService from '@/js/apis/transport-service';
import {
  formatDay,
  formatInterval,
  isoDate,
  normalizeColour,
  safeWebsite,
  seasonalKind,
  splitLines,
} from '@/js/transport-utils';

export default {
  components: { TransportBadge, TransportDayNavigation },

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

    lineColour() {
      return transportLineColour(this.data);
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

    hasService() {
      if (!this.schedule) {
        return false;
      }
      return this.isLine
        ? this.schedule.directions.some((direction) => direction.trips.length)
        : this.schedule.lines.some((line) => line.departures.length);
    },

    hasOnDemand() {
      if (!this.schedule) {
        return false;
      }
      return this.isLine
        ? this.schedule.directions.some((direction) => direction.trips.some((trip) => trip.on_demand))
        : this.schedule.lines.some((line) => line.on_demand?.length);
    },

    // the lists of routes and outings filter on the waypoints that the stops lead to
    waypointsFilter() {
      const ids = this.schedule?.associations?.waypoint_ids ?? [];
      return ids.length ? { w: ids.join(',') } : null;
    },

    visibleSections() {
      const linked = this.schedule?.associations ?? {};
      const filter = this.waypointsFilter;
      return [
        { key: 'waypoints', type: 'w', title: this.$gettext('Waypoints near a stop'), items: linked.waypoints ?? [] },
        {
          key: 'routes',
          type: 'r',
          title: this.$gettext('Routes you can reach'),
          items: linked.routes ?? [],
          all: filter && { name: 'routes', query: filter },
          allLabel: this.$gettext('See all routes'),
        },
        {
          key: 'outings',
          type: 'o',
          title: this.$gettext('Recent outings'),
          items: linked.outings ?? [],
          all: filter && { name: 'outings', query: filter },
          allLabel: this.$gettext('See all outings'),
        },
      ].filter((section) => section.items.length);
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

    goTo(day) {
      this.date = day;
      this.load();
    },

    formatDay(day) {
      return formatDay(day, this.$language.current);
    },

    mode(line) {
      const mode = (line.mode || '').toLowerCase();
      // Navitia calls the buses of the long distance coaches
      return mode === 'coach' ? 'bus' : mode;
    },

    navitiaColour(line) {
      return normalizeColour(line.color ? '#' + line.color : '', '#4a5568');
    },

    isOnDemand(line, time) {
      return !!line.on_demand?.includes(time);
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

.transport-line {
  display: inline-block;
  min-width: 2em;
  margin: 0 0.3em 0.3em 0;
  padding: 0 0.5em;
  border-radius: 1em;
  background-color: #e2e8f0;
  color: #1a202c;
  font-weight: 600;
  text-align: center;
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

.transport-message {
  margin-bottom: 0.8em;
  text-align: center;

  a {
    display: block;
  }
}

.transport-scroll {
  max-width: 100%;
  overflow-x: auto;
}

.transport-departures {
  border-collapse: collapse;
  width: 100%;

  th {
    padding: 0.2em 0.6em 0.2em 0;
    text-align: left;
  }

  td {
    padding: 0.3em 0.6em 0.3em 0;
    vertical-align: top;
  }

  tbody tr + tr > * {
    border-top: 1px solid #edf2f7;
  }
}

.transport-time {
  display: inline-block;
  margin: 0 0.3em 0.3em 0;
  padding: 0 0.4em;
  border-radius: 3px;
  background-color: #edf2f7;
  font-variant-numeric: tabular-nums;

  &.is-on-demand {
    border: 1px dashed #718096;
    font-style: italic;
  }
}

.transport-direction h4 {
  margin: 0.8em 0 0.3em;
  font-weight: 600;
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

.transport-on-demand {
  font-style: italic;
  color: #4a5568;
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

.transport-all {
  display: inline-block;
  margin-top: 0.3em;
  font-weight: 600;
}

.transport-source {
  margin-top: 1em;
  font-size: 0.9em;
}
</style>
