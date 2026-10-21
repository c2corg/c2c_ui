<template>
  <modal-window ref="modalWindow" @hide="onHide">
    <template #header>
      <div class="has-text-centered">
        <router-link v-if="nearestWaypoint" :to="waypointRoute(nearestWaypoint)" custom v-slot="{ href, navigate }">
          <a :href="href" @click="goTo($event, navigate)">{{ name }}</a>
        </router-link>
        <span v-else>{{ name }}</span>
      </div>
    </template>

    <template v-if="stop">
      <p v-if="loading" v-translate>Loading...</p>
      <p v-else-if="error" class="has-text-danger" v-translate>Error while loading data</p>

      <template v-else>
        <!-- GTFS stop: lines and timetable -->
        <template v-if="timetable">
          <p class="transport-stop-lines">
            <button
              v-for="line of timetable.lines"
              :key="line.route_id"
              class="transport-stop-line"
              :title="line.headsigns.join(', ')"
              @click="$emit('show-line', line)"
            >
              <transport-badge :line="line" />
            </button>
          </p>

          <transport-day-navigation v-model="date" :start="timetable.start" :services="timetable.services" />

          <p v-if="!departures.length" class="has-text-centered">
            <span v-translate>No departure this day.</span>
            <button v-if="nextDay" class="button is-small is-light ml-2" @click="date = nextDay">
              <span v-translate>Next service day</span>
            </button>
          </p>
          <div
            v-for="{ line, departures: lineDepartures } of departures"
            :key="line.route_id"
            class="transport-stop-day"
          >
            <transport-badge :line="line" />
            <div
              v-for="group of groupByHeadsign(lineDepartures)"
              :key="group.headsign"
              class="transport-stop-direction"
            >
              <span v-if="group.headsign" class="transport-stop-headsign">&rarr; {{ group.headsign }}</span>
              <span class="transport-stop-times">
                <span v-for="(departure, i) of group.departures" :key="i" class="tag is-light">
                  {{ formatTime(departure.minutes) }}<sup v-if="isNextDay(departure.minutes)">+1</sup>
                </span>
              </span>
            </div>
          </div>
        </template>

        <!-- Navitia stop not matched with a GTFS stop -->
        <template v-else-if="stop.lines">
          <p v-for="line of stop.lines" :key="line.id" class="transport-stop-text-line">
            <strong v-translate>Line</strong> : {{ line.line }}
            <template v-if="line.operator">
              <br />
              <strong v-translate>Operator</strong> : {{ line.operator }}
            </template>
          </p>
          <p class="help" v-translate>The timetables are not available for this stop.</p>
        </template>

        <template v-if="waypoints.length">
          <hr />
          <p v-translate>Close to:</p>
          <ul>
            <li v-for="waypoint of waypoints" :key="waypoint.document_id">
              <router-link :to="waypointRoute(waypoint)" custom v-slot="{ href, navigate }">
                <a :href="href" @click="goTo($event, navigate)">{{ waypointTitle(waypoint) }}</a>
              </router-link>
              <small> ({{ waypoint.distance }} km)</small>
              <button class="button is-small is-light ml-2" @click="$emit('show-waypoint', { waypoint, stop })">
                <span v-translate>Show the associated point of interest</span>
              </button>
            </li>
          </ul>
        </template>

        <p v-for="feed of feeds" :key="feed.attribution" class="help transport-stop-source">
          <span v-translate>Source</span> : {{ feed.attribution }} ({{ feed.license }}) &middot;
          <span v-translate>Updated</span> : {{ feed.imported_at ? feed.imported_at.slice(0, 10) : '' }}
        </p>
      </template>
    </template>
  </modal-window>
</template>

<script>
import TransportBadge from './TransportBadge';
import TransportDayNavigation from './TransportDayNavigation';

import transportService from '@/js/apis/transport-service';
import { formatTime, isNextDay, nextServiceDay, stopDepartures, toIsoDate } from '@/js/transport-utils';

export default {
  components: {
    TransportBadge,
    TransportDayNavigation,
  },

  emits: ['hide', 'show-line', 'show-waypoint'],

  data() {
    return {
      // the stop of the map (light): `kind` is 'gtfs' (details are requested) or 'navitia'
      stop: null,
      details: null,
      loading: false,
      error: false,
      // the day of the timetable, YYYY-MM-DD
      date: toIsoDate(new Date()),
    };
  },

  computed: {
    name() {
      return this.stop?.stoparea_name ?? '';
    },

    // lines and timetables of a GTFS stop
    timetable() {
      return this.details?.details ?? null;
    },

    // the feeds of the stops of the place (the first one is the one of the main stop)
    feeds() {
      return this.details?.feeds ?? (this.details?.feed ? [this.details.feed] : []);
    },

    // waypoints are sorted by distance, the first one is the nearest
    waypoints() {
      return this.details?.waypoints ?? this.stop?.waypoints ?? [];
    },

    nearestWaypoint() {
      return this.waypoints[0];
    },

    departures() {
      return this.timetable ? stopDepartures(this.timetable, this.date) : [];
    },

    nextDay() {
      return this.timetable ? nextServiceDay(this.timetable.start, this.timetable.services, this.date) : null;
    },
  },

  methods: {
    formatTime,
    isNextDay,

    /** Shows a stop of the map */
    show(stop) {
      this.stop = stop;
      this.details = null;
      this.error = false;
      this.$refs.modalWindow.show();

      if (stop.kind === 'gtfs') {
        this.load(stop.id);
      }
    },

    hide() {
      this.$refs.modalWindow.hide();
    },

    onHide() {
      this.$emit('hide');
    },

    load(id) {
      this.loading = true;
      transportService
        .getStop(id)
        .then(({ data }) => {
          if (this.stop?.id !== id) {
            return;
          }
          this.details = data;
          // the first day with a timetable, from today
          const today = toIsoDate(new Date());
          this.date = nextServiceDay(data.details.start, data.details.services, today) ?? today;
        })
        .catch(() => {
          this.error = true;
        })
        .finally(() => {
          this.loading = false;
        });
    },

    groupByHeadsign(departures) {
      const groups = [];
      for (const departure of departures) {
        let group = groups.find((g) => g.headsign === departure.headsign);
        if (!group) {
          group = { headsign: departure.headsign, departures: [] };
          groups.push(group);
        }
        group.departures.push(departure);
      }
      return groups;
    },

    // let the router handle the click (modifier keys included), then close the modal
    goTo(event, navigate) {
      navigate(event);
      this.hide();
    },

    waypointRoute(waypoint) {
      return { name: 'waypoint', params: { id: waypoint.document_id } };
    },

    waypointTitle(waypoint) {
      return this.$documentUtils.getDocumentTitle({ type: 'w', locales: waypoint.locales });
    },
  },
};
</script>

<style scoped lang="scss">
.transport-stop-lines {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em;
}

.transport-stop-line {
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.transport-stop-day {
  margin-bottom: 1em;
}

.transport-stop-direction {
  margin: 0.3em 0 0 0.5em;
}

.transport-stop-headsign {
  display: block;
  font-size: 0.9em;
}

.transport-stop-times {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25em;
}

.transport-stop-text-line {
  margin-bottom: 0.5rem;
}

.transport-stop-source {
  margin-top: 1em;
}
</style>
