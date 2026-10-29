<template>
  <div v-if="hasData" class="elevation-profile-container" :class="{ hidden: fullScreenHidden }">
    <form v-if="timeAvailable" class="has-text-centered">
      <span class="is-size-7" v-translate>See profile based on:</span>
      <br />

      <input
        id="c2c-elevation-profile-distance"
        v-model="mode"
        type="radio"
        value="distance"
        class="is-checkradio is-small is-primary"
      />
      <label v-translate for="c2c-elevation-profile-distance">Distance</label>

      <input
        id="c2c-elevation-profile-time"
        v-model="mode"
        type="radio"
        value="time"
        class="is-checkradio is-small is-primary"
      />
      <label v-translate for="c2c-elevation-profile-time">Time</label>
    </form>

    <div ref="graph" class="elevation-profile-chart" />

    <button
      :title="$gettext('Toggle elevation profile')"
      class="elevation-profile-fullscreen-toggle"
      @click="toggleFullScreenProfile"
    >
      <fa-icon :icon="fullScreenHidden ? 'chevron-up' : 'chevron-down'" />
    </button>
  </div>
</template>

<script lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import debounce from '@/js/debounce';
import bus from '@/js/event-bus';
import d3 from '@/js/libs/d3';
import ol from '@/js/libs/ol';
import { documentProperty } from '@/js/properties';

// what the elevation profile tells the map (OlMap) and the map box (MapBox), through the event bus
export function emitCursorEndEvent() {
  bus.emit('elevation_profile', { action: 'cursor_end' });
}

export function emitCursorMoveEvent(coord: number[]) {
  bus.emit('elevation_profile', { action: 'cursor_move', coord });
}

export function emitToggleFullScreenEvent(hide = true) {
  bus.emit('elevation_profile', { action: 'toggle_fullscreen', hide });
}
</script>

<script setup lang="ts">
// a point of the profile
type Point = { date: Date | null; ele: number; d: number; elapsed: number | undefined };

const props = defineProps({ ...documentProperty });

const emit = defineEmits(['has-data']);

const { $gettext } = useGlobalProperties();

const graph = useTemplateRef<HTMLDivElement>('graph');

/** Indicates whether there is any elevation data to display */
const hasData = ref(false);
/** Indicates whether time information is available */
const timeAvailable = ref(false);
/** X axis is either distance or time */
const mode = ref('distance');
/** The elevation profile can be toggled in full screen mode */
const fullScreenHidden = ref(false);

// the chart, drawn by d3: kept out of reactive state
/** Geometry coordinates */
let coords: number[][] = [];
/** Graph data */
let data: Point[] = [];
let margin = { top: 0, right: 0, bottom: 0, left: 0 };
// d3 selections, scales, axes and line generators (d3 is untyped)
let svg: any = null;
let container: any = null;
/** Horizontal scale (distance) */
let x1: any = null;
/** Horizontal axis (distance) */
let x1Axis: any = null;
/** Horizontal scale (time) */
let x2: any = null;
/** Horizontal axis (time) */
let x2Axis: any = null;
/** Vertical scale (elevation) */
let y: any = null;
/** Vertical axis (elevation) */
let yAxis: any = null;
/** Time line generator */
let tLine: any = null;
/** Distance line generator */
let dLine: any = null;
/** Svg path element representing the distance or time line */
let line: any = null;
/** Vertical line for focusing a specific point */
let focusv: any = null;
/** Horizontal line for focusing a specific point */
let focush: any = null;
/** Marker for focusing a specific point */
let focus: any = null;
/** Focused point info (distance) */
let bubble1: any = null;
/** Focused point info (time) */
let bubble2: any = null;
let resizeObserver: ResizeObserver | undefined;
let debouncedOnResize: (width: number, height: number) => void;

const i18n_ = {
  elevation: $gettext('Elevation'),
  elevation_legend: $gettext('Elevation (m)'),
  meters: $gettext('meters'),
  distance: $gettext('Distance'),
  distance_legend: $gettext('Distance (km)'),
  km: $gettext('kilometers'),
  time: $gettext('Time'),
  duration: $gettext('Duration'),
  duration_legend: $gettext('Duration (hrs)'),
};

function computeCoords() {
  const geom_detail = JSON.parse(props.document.geometry!.geom_detail!);
  // concatenate MultiLineString or equivalent splitted data
  const depth = Array.isArray(geom_detail.coordinates[0][0]) ? 1 : 0;
  coords = geom_detail.coordinates.flat(depth);

  // is there any elevation data?
  if (!coords.some((coord) => coord.length > 2 && coord[2] !== 0)) {
    return;
  }

  timeAvailable.value = coords.every((coord) => coord.length > 3);
  hasData.value = true;
  emit('has-data');
}

function createChart() {
  const withTime = timeAvailable.value;
  const startDate = withTime ? new Date(coords[0][3] * 1000) : null;

  let totalDist = 0;
  data = coords.map((coord, i, coords) => {
    const date = withTime ? new Date(coord[3] * 1000) : null;

    let d = 0;

    if (i > 0) {
      // convert from web mercator to lng/lat
      const deg1 = ol.proj.transform([coords[i][0], coords[i][1]], 'EPSG:3857', 'EPSG:4326');
      const deg2 = ol.proj.transform([coords[i - 1][0], coords[i - 1][1]], 'EPSG:3857', 'EPSG:4326');
      // arc distance x earth radius
      d = d3.geoDistance(deg1, deg2) * 6371;
    }
    totalDist += d;

    return {
      date,
      ele: coord[2] ?? 0,
      d: totalDist,
      elapsed: withTime ? date!.getTime() - startDate!.getTime() : undefined,
    };
  });

  // create chart
  const wrapper = graph.value!;

  const size = {
    width: wrapper.offsetWidth,
    height: wrapper.offsetHeight,
  };

  margin = {
    top: 40,
    right: 10,
    bottom: 25,
    left: 35,
  };

  const width = size.width - margin.left - margin.right;
  const height = size.height - margin.top - margin.bottom;

  // Add an SVG element with the desired dimensions and margin
  svg = d3.select(graph.value!).append('svg').attr('width', size.width).attr('height', size.height);
  container = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // Scales and axes
  y = d3.scaleLinear().range([height, 0]);
  yAxis = d3.axisLeft().scale(y).tickFormat(d3.format('.0f'));
  y.domain(d3.extent(data, (d: Point) => d.ele)).nice();

  x1 = d3.scaleLinear().range([0, width]);
  x1Axis = d3.axisBottom().scale(x1);
  x1.domain(d3.extent(data, (d: Point) => d.d)).nice();

  if (timeAvailable.value) {
    x2 = d3.scaleTime().range([0, width]);
    x2Axis = d3
      .axisBottom()
      .scale(x2)
      // force display of elapsed time as hrs:mins. It is not datetime!
      .tickFormat((t: number) => ~~(t / 3600000) + ':' + d3.format('02d')(~~((t % 3600000) / 60000)));

    x2.domain(d3.extent(data, (d: Point) => d.elapsed)).nice(d3.timeHour);
  }

  updateXAxisTicks(width);

  container
    .append('g')
    .attr('class', 'y axis')
    .call(yAxis)
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 6)
    .attr('dy', '.5em')
    .attr('class', 'legend')
    .style('text-anchor', 'end')
    .text(i18n_.elevation_legend);

  container
    .append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(x1Axis)
    .append('text')
    .attr('x', size.width - margin.left - margin.right)
    .attr('dy', '-.5em')
    .attr('class', 'legend')
    .style('text-anchor', 'end')
    .text(i18n_.distance_legend);

  // data lines
  dLine = d3
    .line()
    .x((d: Point) => x1(d.d))
    .y((d: Point) => y(d.ele));

  if (timeAvailable.value) {
    tLine = d3
      .line()
      .x((d: Point) => x2(d.elapsed))
      .y((d: Point) => y(d.ele));
  }

  // display line path
  line = container.append('path').datum(data).attr('class', 'line').attr('d', dLine);

  // Display point information on hover
  focusv = container
    .append('line')
    .attr('class', 'target')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 0)
    .attr('y2', size.height - margin.bottom - margin.top)
    .style('display', 'none');

  focush = container
    .append('line')
    .attr('class', 'target')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', size.width - margin.right - margin.left)
    .attr('y2', 0)
    .style('display', 'none');

  focus = container.append('circle').attr('class', 'circle').attr('r', 4.5).style('display', 'none');

  bubble1 = container
    .append('text')
    .attr('x', (size.width - margin.left - margin.right) / 2)
    .attr('dy', '-.71em')
    .attr('class', 'bubble')
    .style('text-anchor', 'middle')
    .style('display', 'none')
    .text('');

  bubble2 = container
    .append('text')
    .attr('x', (size.width - margin.left - margin.right) / 2)
    .attr('dy', '-1.71em')
    .attr('class', 'bubble')
    .style('text-anchor', 'middle')
    .style('display', 'none')
    .text('');

  container
    .append('rect')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height)
    .on(
      'mouseover',
      () => {
        focus.style('display', null);
        focush.style('display', null);
        focusv.style('display', null);
        bubble1.style('display', null);
        bubble2.style('display', null);
      },
      { passive: true }
    )
    .on(
      'mouseout',
      () => {
        focus.style('display', 'none');
        focush.style('display', 'none');
        focusv.style('display', 'none');
        bubble1.style('display', 'none');
        bubble2.style('display', 'none');
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
  resizeObserver.observe(graph.value!);
}

function onResize(graphWidth: number, graphHeight: number) {
  const width = graphWidth - margin.left - margin.right;
  const height = graphHeight - margin.top - margin.bottom;

  // recompute axes, lines and resize elements
  updateXAxisTicks(width);
  x1.range([0, width]);
  if (timeAvailable.value) {
    x2.range([0, width]);
  }
  const axis = mode.value === 'distance' ? x1Axis : x2Axis;
  container
    .select('.x.axis')
    .call(axis)
    .attr('transform', 'translate(0,' + height + ')');
  container.select('.x.axis .legend').attr('x', width);

  y.range([height, 0]);
  container.select('.y.axis').call(yAxis);

  line.attr('d', mode.value === 'distance' ? dLine : tLine);
  focush.attr('x2', width);
  bubble1.attr('x', (width - margin.left - margin.right) / 2);
  bubble2.attr('x', (width - margin.left - margin.right) / 2);
  container.select('rect.overlay').attr('width', width);
  svg
    .attr('width', graphWidth)
    // while on fullscreen, the x axis switch is displayed in top right corner
    .attr('height', !window.document.fullscreenElement ? graphHeight : graphHeight + margin.top);

  focus.style('display', 'none');
  focush.style('display', 'none');
  focusv.style('display', 'none');
  bubble1.style('display', 'none');
  bubble2.style('display', 'none');
}

function updateXAxisTicks(width: number) {
  // try to avoid too many ticks on x axis if the graph is small.
  // with null, we let d3 decide
  let ticksCount: number | null = Math.round(width / 40);
  ticksCount = ticksCount < 8 ? ticksCount : null;
  x1Axis?.ticks(ticksCount);
  if (timeAvailable.value) {
    x2Axis?.ticks(ticksCount);
  }
}

function toggleFullScreenProfile() {
  const isFullScreen = window.document.fullscreenElement !== null;
  if (!isFullScreen) {
    return;
  }

  fullScreenHidden.value = !fullScreenHidden.value;
  emitToggleFullScreenEvent(fullScreenHidden.value);
}

function setCursor(mouseMoveEvent: MouseEvent) {
  const bisectDistance = d3.bisector((d: Point) => d.d).left;
  const bisectDate = d3.bisector((d: Point) => d.elapsed).left;

  const formatDistance = d3.format('.2f');
  const formatDate = d3.timeFormat('%H:%M');
  const formatMinutes = d3.format('02d');
  const formatElevation = d3.format('d');

  const bisect = mode.value === 'distance' ? bisectDistance : bisectDate;
  const x0 =
    mode.value === 'distance'
      ? x1.invert(d3.pointer(mouseMoveEvent, container.node())[0])
      : x2.invert(d3.pointer(mouseMoveEvent, container.node())[0]);

  const i = bisect(data, x0, 1, data.length - 1);
  const d0 = data[i - 1];
  const d1 = data[i];

  const d =
    mode.value === 'distance' ? (x0 - d0.d > d1.d - x0 ? d1 : d0) : x0 - d0.elapsed! > d1.elapsed! - x0 ? d1 : d0;

  const dy = y(d.ele);
  const dx = mode.value === 'distance' ? x1(d.d) : x2(d.elapsed);

  focus.attr('transform', 'translate(' + dx + ',' + dy + ')');
  focush.attr('transform', 'translate(0,' + dy + ')');
  focusv.attr('transform', 'translate(' + dx + ',0)');

  bubble1.text(
    i18n_.elevation +
      ' ' +
      formatElevation(d.ele) +
      i18n_.meters +
      ' / ' +
      i18n_.distance +
      ' ' +
      formatDistance(d.d) +
      i18n_.km
  );

  if (timeAvailable.value) {
    const elapsed = d.elapsed! / 1000;
    bubble2.text(
      i18n_.time +
        ' ' +
        formatDate(d.date) +
        ' / ' +
        i18n_.duration +
        ' ' +
        ~~(elapsed / 3600) +
        ':' +
        formatMinutes(~~((elapsed % 3600) / 60))
    );
  }

  emitCursorMoveEvent(coords[d === d0 ? i - 1 : i]);
}

function updateChartXAxis() {
  const nLine = mode.value === 'distance' ? dLine : tLine;
  const axis = mode.value === 'distance' ? x1Axis : x2Axis;
  const legend = mode.value === 'distance' ? i18n_.distance_legend : i18n_.duration_legend;

  line.transition().duration(1000).attr('d', nLine);

  d3.select('.x.axis').call(axis);
  d3.select('.x.axis .legend').text(legend);
}

watch(mode, updateChartXAxis);

if (props.document.geometry && props.document.geometry.geom_detail) {
  computeCoords();
}

onMounted(() => {
  if (hasData.value) {
    d3.then(createChart);
  }

  debouncedOnResize = debounce(onResize, 100);
});

onBeforeUnmount(() => {
  resizeObserver?.unobserve(graph.value!);
});
</script>

<style lang="scss" scoped>
$C2C-orange: red;

:deep(.elevation-profile-chart) {
  height: 300px; // default height on page

  .axis path,
  .axis line {
    fill: none;
    stroke: black;
    shape-rendering: crispEdges;
  }

  .axis .legend {
    fill: black;
  }

  .line {
    fill: none;
    stroke: $C2C-orange;
    stroke-width: 3px;
  }

  .circle {
    fill: white;
    stroke: $C2C-orange;
    stroke-width: 2px;
  }

  line.target {
    stroke: lightgray;
    stroke-width: 1px;
  }

  .bubble {
    font-size: 12px;
  }

  .overlay {
    fill: none;
    pointer-events: all;
  }
}

:deep(.elevation-profile-fullscreen-toggle) {
  display: none;
}

:fullscreen .elevation-profile-container {
  $shadow: 1px -4px 5px rgb(0 0 0 / 20%);

  position: absolute;
  bottom: 0;
  height: 30%;
  max-height: 350px;
  min-height: 200px;
  width: 100%;
  background-color: white;
  box-shadow: $shadow;

  &.hidden {
    height: 0;
    min-height: 0;
  }

  > .elevation-profile-fullscreen-toggle {
    $height: 23px;
    display: inline-block;
    position: absolute;
    width: 48px;
    height: $height;
    top: -$height;
    left: 0;
    right: 0;
    margin: 0 auto;
    text-align: center;
    background-color: white;
    cursor: pointer;
    border-radius: 8px 8px 0 0;
    border: 0;
    padding: 0;
    box-shadow: $shadow;
  }

  > form {
    position: absolute;
    right: 0;
    z-index: 2;
  }

  .elevation-profile-chart {
    height: 100%;

    :deep(svg) {
      position: absolute;
    }
  }
}
</style>
