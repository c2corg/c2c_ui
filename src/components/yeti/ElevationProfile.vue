<template>
  <div>
    <div>
      <div ref="graph" class="elevation-profile-chart" />
    </div>
    <div class="elevation-generate-panel">
      <h4 class="title is-6" v-translate>Generate new elevations</h4>
      <div>
        <input-checkbox v-model="interpolate" class="mt-2">
          <span v-translate>Add more points</span>
        </input-checkbox>
        <div v-if="interpolate">
          <div class="control-subpanel">
            <label for="inputInterpolate" v-translate>Distance</label>
            <input
              id="inputInterpolate"
              class="input is-small input-interpolate ml-2"
              type="number"
              min="5"
              step="5"
              v-model.number="interpolateValue"
            />
            <info inline class="ml-0 pl-0" v-if="atLeastOneLineChunkHasTooMuchPoints">
              <span v-translate key="1">Too much points</span>
            </info>
            <info inline class="ml-0 pl-0" v-if="interpolateValueInvalid">
              <span v-translate key="2">Invalid value</span>
            </info>
          </div>
          <info type="help" class="column">
            <p v-translate>Will generate new points along route, at regular interval, defined by distance in meters</p>
          </info>
        </div>
      </div>
    </div>
    <div class="is-flex is-justify-content-end is-align-items-center">
      <info inline v-if="routeIntersectsYetiAreas">
        <span v-translate>Some points are out of extent</span>
      </info>
      <button
        class="button is-primary"
        :class="{ 'is-disabled': validSimplifyTolerance, 'is-loading': loading }"
        :disabled="loading"
        @click="onCalculateElevations"
        v-translate
      >
        Generate elevations
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type Feature from 'ol/Feature';
import type { Coordinate } from 'ol/coordinate';
import type LineString from 'ol/geom/LineString';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch, type PropType } from 'vue';

import simplify from './map-layers/simplify';

import Info from '@/components/yeti/Info.vue';
import Yetix from '@/components/yeti/Yetix.vue';
import yetixEvents from '@/components/yeti/yetix-events';
import { useGlobalProperties } from '@/js/composables/global-properties';
import debounce from '@/js/debounce';
import d3 from '@/js/libs/d3';
import ol from '@/js/libs/ol';

const MIN_INTERPOLATE_VALUE = 5;

// d3 is loaded untyped (src/js/libs/d3.ts): its selections, scales, axes and shapes
type D3Object = any;
// a point of the profile: its elevation, its distance from the start, and from the start of its line chunk
type ProfilePoint = { ele: number; d: number; localD: number };
// the distances of a line chunk
type ProfileArea = { min: number; max: number };

const props = defineProps({
  features: {
    type: Array as PropType<Feature<LineString>[]>,
    required: true,
  },
});

const { $gettext } = useGlobalProperties();

const data = ref<ProfilePoint[][]>([]);
const loading = ref(false);
const interpolate = ref(false);
// '' when the number input is empty
const interpolateValue = ref<number | ''>(50);
const i18n_ = ref({
  elevation_legend: $gettext('Elevation (m)'),
  distance_legend: $gettext('Distance (km)'),
});
const errors = ref({
  actionDisabled: $gettext('Action is disabled. You must confirm simplified geometry first.'),
  fromApi: $gettext('One or more route could not be processed:'),
  interpolateValue: $gettext('Interpolate value should be a number > 0'),
  tooMuchPoints: $gettext(
    'One or more line chunks will generate more than 3000 points. Adjust distance to generate less points.'
  ),
});
let area: D3Object;
let areaLine: D3Object;
let areasData: ProfileArea[][] = [];
let axisX: D3Object;
let axisY: D3Object;
let concatCoords: Coordinate[] = [];
let concatData: ProfilePoint[] = [];
let container: D3Object;
let coords: Coordinate[][] = [];
let focus: D3Object;
let line: D3Object;
let margin = { top: 8, right: 10, bottom: 25, left: 15 };
let popupAltitude: D3Object;
let popupAltitudeRect: D3Object;
let popupAltitudeText: D3Object;
let resizeObserver: ResizeObserver | undefined;
let scaleX: D3Object;
let scaleY: D3Object;
let size = { width: 0, height: 0 };
let svg: D3Object;
const graphRef = useTemplateRef<HTMLElement>('graph');

const areas = computed(() => Yetix.areas);

const fetchWpsAlti = computed(() => Yetix.fetchWpsAlti);

const validSimplifyTolerance = computed(() => Yetix.validSimplifyTolerance);

const atLeastOneLineChunkHasTooMuchPoints = computed(() => {
  if (interpolateValueInvalid.value) {
    return false;
  }
  return data.value.filter((d) => {
    return (d[d.length - 1].localD * 1000) / Number(interpolateValue.value) > 3000;
  }).length;
});

const interpolateValueInvalid = computed(() => {
  // type number is empty string when not number
  return interpolateValue.value === 0 || interpolateValue.value === '';
});

const routeIntersectsYetiAreas = computed(() => {
  if (areas.value.length) {
    for (let feature of props.features) {
      let coords = feature.getGeometry()!.getCoordinates();
      // will simplify coords to improve compute time
      // if no z, add 0 (simplify not working)
      coords = coords.map((coord) => {
        if (!coord[2]) {
          coord[2] = 0;
        }
        return coord;
      });
      // and simplify
      coords = simplify(coords, 200, true);
      for (let coord of coords) {
        let inside = areas.value[0].geometry.intersectsCoordinate(coord);
        // return when at least one point if outside
        if (!inside) {
          return true;
        }
      }
    }
  }
  return false;
});

function onCalculateElevations() {
  // deal with errors first
  if (validSimplifyTolerance.value) {
    return window.alert(errors.value.actionDisabled);
  }
  if (atLeastOneLineChunkHasTooMuchPoints.value) {
    return window.alert(errors.value.tooMuchPoints);
  }
  if (interpolateValueInvalid.value) {
    return window.alert(errors.value.interpolateValue);
  }
  // start loading
  loading.value = true;
  // and defer (next cycle)
  setTimeout(() => {
    // start by removing all elevations
    removeAllElevations();
    // interpolateValue is 5 meters min, or 0 if not checked
    const interpolateDistance = interpolate.value ? Math.max(MIN_INTERPOLATE_VALUE, Number(interpolateValue.value)) : 0;

    // build promises for each http request (one per line chunk)
    const promises: Promise<{ status?: string; message?: string }>[] = [];
    // for each filtered features
    props.features.forEach((feature) => {
      let points = feature.getGeometry()!.clone().transform('EPSG:3857', 'EPSG:4326').getCoordinates();
      promises.push(
        fetchWpsAlti.value(points, interpolateDistance).then(({ data }) => {
          // if we got features from api, set new geometry to feature
          if (data.features) {
            // first transform coords
            let coords = data.features[0].geometry.coordinates.map((coord: Coordinate) => {
              return ol.proj.transform(coord, 'EPSG:4326', 'EPSG:3857');
            });
            // replace this feature coordinates
            feature.getGeometry()!.setCoordinates(coords);
          }
          // return promise (to deal with errors)
          return data;
        })
      );
    });
    // when all requests finished
    Promise.all(promises).then((promises) => {
      // stop loading
      loading.value = false;
      // emit featureUpdated: routeLayer will update state.features
      yetixEvents.emit('featureUpdated');

      // errors ?
      // if we got status=error, concatenate all errors, and alert
      const apiErrors = promises
        .filter((promise) => promise.status && promise.status === 'error')
        .map((error) => {
          return error.message;
        });
      if (apiErrors.length) {
        window.alert(errors.value.fromApi + '\n' + apiErrors.join('\n'));
      }
    });
  }, 10);
}

function removeAllElevations() {
  props.features.forEach((feature) => {
    let coords = feature.getGeometry()!.getCoordinates();
    coords = coords.map((coord) => {
      coord[2] = 0;
      return coord;
    });
    feature.getGeometry()!.setCoordinates(coords);
  });
  yetixEvents.emit('featureUpdated');
}

function showFeature(index: unknown) {
  container
    .selectAll('.area')
    .select(function (this: Element, d: unknown, i: number) {
      if (index === i) {
        return this;
      }
    })
    .classed('area-highlighted', true);
}

function hideFeature() {
  container.selectAll('.area').classed('area-highlighted', false);
}

function computeCoords() {
  coords = props.features.map((feature) => {
    return feature.getGeometry()!.getCoordinates();
  });
  concatCoords = coords.flat();

  updateData();
}

function updateData() {
  let totalDist = 0;
  data.value = coords.map((c) => {
    let localTotalDist = 0;
    return c.map((coord, i, coords) => {
      let d = 0;

      if (i > 0) {
        // convert from web mercator to lng/lat
        const deg1 = ol.proj.transform([coords[i][0], coords[i][1]], 'EPSG:3857', 'EPSG:4326');
        const deg2 = ol.proj.transform([coords[i - 1][0], coords[i - 1][1]], 'EPSG:3857', 'EPSG:4326');
        // arc distance x earth radius
        d = d3.geoDistance(deg1, deg2) * 6371;
      }
      totalDist += d;
      localTotalDist += d;

      return {
        ele: coord[2] ?? 0,
        d: totalDist,
        localD: localTotalDist,
      };
    });
  });

  concatData = data.value.flat();

  areasData = data.value
    .map((d) => {
      return {
        min: d[0].d,
        max: d[d.length - 1].d,
      };
    })
    .map((d) => {
      // need to duplicate data for d3
      return [d, d];
    });
}

function createChart() {
  // created after a delay: the profile may be closed already
  if (!graphRef.value) {
    return;
  }

  // first, compute coords
  computeCoords();

  const wrapper = graphRef.value;

  size = {
    width: wrapper.offsetWidth,
    height: wrapper.offsetHeight,
  };

  const width = size.width - margin.left - margin.right;
  const height = size.height - margin.top - margin.bottom;

  // Add an SVG element with the desired dimensions and margin
  svg = d3.select(graphRef.value!).append('svg').attr('width', '100%').attr('height', size.height);
  container = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // areas container
  container.append('g').attr('class', 'areas');
  container.append('g').attr('class', 'areas-lines');

  // Scales and axes
  scaleX = d3.scaleLinear().range([0, width]);
  axisX = d3.axisBottom().scale(scaleX);

  scaleY = d3.scaleLinear().range([height, 0]);
  axisY = d3.axisRight().scale(scaleY).ticks(5).tickFormat(d3.format('.0f'));

  // scales containers
  container.append('g').attr('class', 'y axis');
  container.append('g').attr('class', 'x axis');

  // scales legends
  container
    .select('.axis.x')
    .attr('transform', 'translate(0,' + height + ')')
    .call(axisX)
    .append('text')
    .attr('x', size.width - margin.left - margin.right)
    .attr('dy', '-.5em')
    .attr('class', 'legend')
    .style('text-anchor', 'end')
    .text(i18n_.value.distance_legend);

  container
    .select('.axis.y')
    //.attr('transform', 'translate(0, 10)')
    .call(axisY)
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 6)
    .attr('dy', '-1em')
    .attr('class', 'legend')
    .style('text-anchor', 'end')
    .text(i18n_.value.elevation_legend);

  // lines container
  container.append('g').attr('class', 'elevation-lines');

  // then, update chart
  updateChart();

  focus = container.append('circle').attr('class', 'circle').attr('r', 5).style('display', 'none');

  // altitude popup
  popupAltitude = container
    .append('g')
    .attr('class', 'popup')
    .attr('x', margin.left + 5)
    .style('display', 'none');
  popupAltitudeRect = popupAltitude.append('rect').attr('y', -8);
  popupAltitudeText = popupAltitude.append('text').attr('dx', 5).attr('dy', 4);

  container
    .append('rect')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height)
    .on(
      'mouseover',
      () => {
        focus.style('display', null);
        popupAltitude.style('display', null);
      },
      { passive: true }
    )
    .on(
      'mouseout',
      () => {
        focus.style('display', 'none');
        popupAltitude.style('display', 'none');
        emitCursorEndEvent();
      },
      { passive: true }
    )
    .on('mousemove', setCursor, { passive: true });

  // update the graph when it is resized
  resizeObserver = new ResizeObserver(([entry]) => {
    if (entry.contentBoxSize) {
      // Firefox implements `contentBoxSize` as a single content rect, rather than an array
      const contentBoxSize = Array.isArray(entry.contentBoxSize) ? entry.contentBoxSize[0] : entry.contentBoxSize;
      debouncedOnResize(contentBoxSize.inlineSize, contentBoxSize.blockSize);
    } else {
      debouncedOnResize(entry.contentRect.width, entry.contentRect.height);
    }
  });
  resizeObserver.observe(graphRef.value!);
}

function updateChart(force = false) {
  if (force) {
    computeCoords();
  }

  // update axes
  scaleX.domain(d3.extent(concatData, (d: ProfilePoint) => d.d)).nice();
  container.select('.axis.x').call(axisX);

  scaleY.domain(d3.extent(concatData, (d: ProfilePoint) => d.ele)).nice();
  container.select('.axis.y').call(axisY);
  // remove zeroes from y axis
  container
    .select('.axis.y')
    .select('.tick')
    .filter((d: unknown, a: number, b: Element[]) => {
      const first = b[0];
      if (first) {
        let transform = first.getAttribute('transform')!;
        transform = transform.replace('transform(', '').replace(')', '');
        const posy = Number(transform.split(',')[1]);
        if (posy > size.height - margin.top - margin.bottom) {
          return true;
        }
      }
      return false;
    })
    .remove();

  line = d3
    .line()
    .x((d: ProfilePoint) => scaleX(d.d))
    .y((d: ProfilePoint) => scaleY(d.ele));

  area = d3
    .area()
    .x0((d: ProfileArea) => scaleX(d.min))
    .x1((d: ProfileArea) => {
      // set minimum width for lines
      let minWidth = d.max - d.min < 1 ? 5 : 0;
      return scaleX(d.max) + minWidth;
    })
    .y((d: ProfileArea, i: number) => (i === 0 ? 0 : size.height - margin.top - margin.bottom));

  areaLine = d3
    .line()
    .x((d: ProfileArea) => Math.round(scaleX(d.max)) + 0.5)
    .y((d: ProfileArea, i: number) => (i === 0 ? 0 : size.height - margin.top - margin.bottom));

  // build areas
  container.select('.areas').selectAll('path').data(areasData).join('path').attr('class', 'area').attr('d', area);

  // build areas line (dashed)
  let areasDataForLines = structuredClone(areasData);
  // remove last one
  areasDataForLines.pop();
  container.select('.areas-lines').selectAll('path').data(areasDataForLines).join('path').attr('d', areaLine);

  // build lines
  container
    .select('.elevation-lines')
    .selectAll('path')
    .data(data.value)
    .join('path')
    .attr('class', 'line')
    .attr('d', line);
}

function onResize(graphWidth: number, graphHeight: number) {
  const width = graphWidth - margin.left - margin.right;
  const height = graphHeight - margin.top - margin.bottom;

  // recompute axes, lines and resize elements
  scaleX.range([0, width]);
  scaleY.range([height, 0]);
  // update overlay
  container.select('rect.overlay').attr('width', width);

  updateChart();
}

const debouncedOnResize = debounce(onResize, 100);

function setCursor(mouseMoveEvent: MouseEvent) {
  const bisectDistance = d3.bisector((d: ProfilePoint) => d.d).left;

  const x0 = scaleX.invert(d3.pointer(mouseMoveEvent, container.node())[0]);

  const i = bisectDistance(concatData, x0, 1, concatData.length - 1);
  const d0 = concatData[i - 1];
  const d1 = concatData[i];

  const d = x0 - d0.d > d1.d - x0 ? d1 : d0;

  const dy = Math.round(scaleY(d.ele));
  const dx = Math.round(scaleX(d.d));

  focus.attr('transform', 'translate(' + dx + ',' + dy + ')');
  popupAltitude.attr('transform', 'translate(0,' + dy + ')');
  let bbox = popupAltitudeText.node().getBBox();
  popupAltitudeRect.attr('width', Math.round(bbox.width + 10)).attr('height', Math.round(bbox.height));

  popupAltitudeText.text(Math.round(d.ele) + ' m');

  emitCursorMoveEvent(concatCoords[d === d0 ? i - 1 : i]);
}

function emitCursorEndEvent() {
  yetixEvents.emit('elevationProfile', { action: 'cursor_end' });
}

function emitCursorMoveEvent(coord: Coordinate) {
  yetixEvents.emit('elevationProfile', { action: 'cursor_move', coord });
}

watch(
  () => props.features,
  () => {
    updateChart(true);
  }
);

onMounted(() => {
  // debounce creating chart
  debounce(() => {
    d3.then(createChart);
  }, 10)();

  yetixEvents.on('showFeature', showFeature);
  yetixEvents.on('hideFeature', hideFeature);
});

onBeforeUnmount(() => {
  resizeObserver?.unobserve(graphRef.value!);
  // they stayed after leaving the page
  yetixEvents.off('showFeature', showFeature);
  yetixEvents.off('hideFeature', hideFeature);
});
</script>

<style lang="scss" scoped>
@import '@/assets/sass/variables';

:deep(.elevation-profile-chart) {
  height: 150px; // default height on page

  .axis {
    pointer-events: none;
  }

  .axis path,
  .axis line {
    fill: none;
    stroke: $grey;
    shape-rendering: crispEdges;
  }

  .axis .legend {
    fill: $grey;
  }

  .axis .tick {
    color: $grey;
  }

  .axis.x .tick line {
    display: none;
  }

  .line {
    fill: none;
    stroke: red;
    stroke-width: 3px;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .circle {
    fill: red;
    stroke: white;
    stroke-width: 2px;
  }

  .popup {
    font-size: 12px;
    font-weight: bold;
    fill: $primary;
  }

  .popup text {
    fill: white;
  }

  .overlay {
    fill: none;
    pointer-events: all;
  }

  .area {
    fill: none;
  }

  .area-highlighted {
    fill: rgba(255, 255, 0, 0.75);
  }

  .areas-lines {
    stroke: $grey;
    stroke-width: 1px;
    stroke-dasharray: 5;
  }
}

.elevation-generate-panel {
  margin-top: 1rem;
  margin-left: -0.75rem;
  margin-right: -0.75rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  border-top: 1px solid lightgray;
}

.input-interpolate {
  width: 100px;
  margin-right: 0.75rem;
}

.control-subpanel {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  line-height: 2;
  margin-left: 0.75rem;
  margin-bottom: 0.75rem;
  padding-left: 2rem;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  border-left: solid 1px $primary;
}
</style>
