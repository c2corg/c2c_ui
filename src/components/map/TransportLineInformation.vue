<template>
  <modal-window ref="modalWindow" wide @hide="onHide">
    <template #header>
      <div class="has-text-centered">
        <transport-badge v-if="line" :line="details || line" />
        <span v-if="details" class="transport-line-name">{{ details.long_name }}</span>
      </div>
    </template>

    <template v-if="line">
      <!-- several lines under the cursor -->
      <p v-if="candidates.length > 1" class="transport-line-candidates">
        <span v-translate>Lines here</span> :
        <button
          v-for="candidate of candidates"
          :key="candidate.line_id"
          class="transport-line-candidate"
          :class="{ 'is-selected': candidate.line_id === line.line_id }"
          @click="select(candidate)"
        >
          <transport-badge :line="candidate" />
        </button>
      </p>

      <p v-if="loading" v-translate>Loading...</p>
      <p v-else-if="error" class="has-text-danger" v-translate>Error while loading data</p>

      <template v-else-if="timetable">
        <p v-if="details.operator" class="has-text-centered">{{ details.operator }}</p>

        <!-- direction -->
        <div v-if="timetable.directions.length > 1" class="tabs is-toggle is-small is-centered">
          <ul>
            <li v-for="(d, i) of timetable.directions" :key="i" :class="{ 'is-active': i === directionIndex }">
              <a @click="directionIndex = i">{{ d.label }}</a>
            </li>
          </ul>
        </div>
        <p v-if="direction" class="has-text-centered transport-line-link">
          <strong>{{ direction.origin }}</strong> &rarr; <strong>{{ direction.destination }}</strong>
          <span v-if="direction.headsign" class="help">{{ direction.headsign }}</span>
        </p>

        <transport-day-navigation v-model="date" :start="timetable.start" :services="timetable.services" />

        <p v-if="!table.trips.length" class="has-text-centered">
          <span v-translate>No departure this day.</span>
          <button v-if="nextDay" class="button is-small is-light ml-2" @click="date = nextDay">
            <span v-translate>Next service day</span>
          </button>
        </p>

        <template v-else>
          <!-- frequency -->
          <p class="transport-line-frequency">
            <span> <strong v-translate>Departures</strong> : {{ frequency.count }} </span>
            <span> <strong v-translate>First</strong> : {{ formatTime(frequency.first) }} </span>
            <span> <strong v-translate>Last</strong> : {{ formatTime(frequency.last) }} </span>
            <span v-if="frequency.interval"> <strong v-translate>Every</strong> : ~{{ frequency.interval }} min </span>
          </p>

          <!-- stops served -->
          <h4 class="title is-6 mt-4" v-translate>Stops served</h4>
          <ol class="transport-line-stops" :style="{ '--line-color': lineColor }">
            <li v-for="stop of direction.stops" :key="stop.stop_id">
              <button class="transport-line-stop" @click="$emit('show-stop', stopSummary(stop))">
                {{ stop.name }}
              </button>
              <span v-if="stop.linked" class="tag is-info is-light ml-2" v-translate>Access point</span>
            </li>
          </ol>

          <!-- timetable -->
          <h4 class="title is-6 mt-4" v-translate>Timetable</h4>
          <div class="transport-line-timetable">
            <table class="table is-narrow is-striped">
              <tbody>
                <tr v-for="row of table.rows" :key="row.stop.stop_id">
                  <th>{{ row.stop.name }}</th>
                  <td v-for="(time, i) of row.times" :key="i">
                    {{ time === null ? '|' : formatTime(time) }}<sup v-if="time !== null && isNextDay(time)">+1</sup>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <p v-if="safeUrl" class="mt-3">
          <a :href="safeUrl" target="_blank" rel="noopener noreferrer">
            <fa-icon icon="external-link-alt" />
            <span v-translate>Timetable sheet</span>
          </a>
        </p>
        <p class="help transport-line-source">
          <span v-translate>Source</span> : {{ details.feed.attribution }} ({{ details.feed.license }}) &middot;
          <span v-translate>Updated</span> : {{ updatedAt }}
        </p>
      </template>
    </template>
  </modal-window>
</template>

<script>
import TransportBadge from './TransportBadge';
import TransportDayNavigation from './TransportDayNavigation';

import transportService from '@/js/apis/transport-service';
import ol from '@/js/libs/ol';
import { formatTime, frequency, isNextDay, nextServiceDay, timetable, toIsoDate } from '@/js/transport-utils';

export default {
  components: {
    TransportBadge,
    TransportDayNavigation,
  },

  emits: ['hide', 'line-selected', 'line-loaded', 'show-stop'],

  data() {
    return {
      // the lines of the map (light) under the click, and the one shown
      candidates: [],
      line: null,
      details: null,
      loading: false,
      error: false,
      directionIndex: 0,
      // the day of the timetable, YYYY-MM-DD
      date: toIsoDate(new Date()),
    };
  },

  computed: {
    // directions, stops and timetables
    timetable() {
      return this.details?.details ?? null;
    },

    direction() {
      return this.timetable?.directions[this.directionIndex] ?? null;
    },

    table() {
      return this.direction ? timetable(this.timetable, this.direction, this.date) : { trips: [], rows: [] };
    },

    frequency() {
      const firstTimes = this.table.trips.map((trip) => trip.times.find((time) => time !== null));
      return frequency(firstTimes.filter((time) => time !== undefined));
    },

    nextDay() {
      return this.timetable ? nextServiceDay(this.timetable.start, this.timetable.services, this.date) : null;
    },

    lineColor() {
      const color = this.details?.color ?? this.line?.color;
      return color && color !== 'FFFFFF' ? `#${color}` : '#808080';
    },

    // the URL comes from a feed: only web pages
    safeUrl() {
      const url = this.details?.url;
      return url && /^https?:\/\//i.test(url) ? url : null;
    },

    updatedAt() {
      return this.details?.feed.imported_at?.slice(0, 10) ?? '';
    },
  },

  methods: {
    formatTime,
    isNextDay,

    /** Shows lines of the map (the first one, the others can be chosen) */
    show(lines) {
      this.candidates = lines;
      this.$refs.modalWindow.show();
      this.select(lines[0]);
    },

    hide() {
      this.$refs.modalWindow.hide();
    },

    onHide() {
      this.line = null;
      this.details = null;
      this.$emit('hide');
    },

    select(line) {
      this.line = line;
      this.details = null;
      this.error = false;
      this.directionIndex = 0;
      this.$emit('line-selected', line);
      this.load(line.line_id);
    },

    load(id) {
      this.loading = true;
      transportService
        .getLine(id)
        .then(({ data }) => {
          if (this.line?.line_id !== id) {
            return;
          }
          this.details = data;
          // the first day with a timetable, from today
          const today = toIsoDate(new Date());
          this.date = nextServiceDay(data.details.start, data.details.services, today) ?? today;
          this.$emit('line-loaded', data);
        })
        .catch(() => {
          this.error = true;
        })
        .finally(() => {
          this.loading = false;
        });
    },

    /** A stop of the line, as the stops of the map */
    stopSummary(stop) {
      const [x, y] = ol.proj.transform([stop.lon, stop.lat], 'EPSG:4326', 'EPSG:3857');
      return { kind: 'gtfs', id: stop.stop_pk, stoparea_name: stop.name, coordinates: { x, y }, linked: stop.linked };
    },
  },
};
</script>

<style scoped lang="scss">
.transport-line-name {
  margin-left: 0.5em;
}

.transport-line-candidates {
  margin-bottom: 0.75em;
}

.transport-line-candidate {
  padding: 0 0.2em;
  border: 0;
  border-bottom: 3px solid transparent;
  background: none;
  cursor: pointer;

  &.is-selected {
    border-bottom-color: currentcolor;
  }
}

.transport-line-link .help {
  display: block;
}

.transport-line-frequency {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5em 1.5em;
}

.transport-line-stops {
  list-style: none;
  margin: 0 0 0 0.5em;
  padding-left: 1em;
  border-left: 4px solid var(--line-color);

  li {
    position: relative;
    padding: 0.15em 0;

    &::before {
      content: '';
      position: absolute;
      left: calc(-1em - 8px);
      top: 0.6em;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 2px solid var(--line-color);
      background: #fff;
      box-sizing: content-box;
    }
  }
}

.transport-line-stop {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }
}

.transport-line-timetable {
  max-height: 20em;
  overflow: auto;

  th {
    position: sticky;
    left: 0;
    background: #fff;
    white-space: nowrap;
  }

  td {
    text-align: center;
  }
}

.transport-line-source {
  margin-top: 1em;
}
</style>
