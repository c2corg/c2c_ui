<template>
  <div v-if="hasData" class="elevation-profile-container">
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
  </div>
</template>

<script>
import debounce from '@/js/debounce';
import d3 from '@/js/libs/d3';
import ol from '@/js/libs/ol';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],

  data() {
    return {
      hasData: false,

      coords: null,
      data: null,
      timeAvailable: false,
      mode: 'distance',

      margin: {},
      svg: null,

      x1: null,
      x1Axis: null,

      x2: null,
      x2Axis: null,

      y: null,
      yAxis: null,

      tLine: null,
      dLine: null,
      line: null,

      focusv: null,
      focush: null,
      focus: null,

      bubble1: null,
      bubble2: null,

      i18n_: {
        elevation: this.$gettext('Elevation'),
        elevation_legend: this.$gettext('Elevation (m)'),
        meters: this.$gettext('meters'),
        distance: this.$gettext('Distance'),
        distance_legend: this.$gettext('Distance (km)'),
        km: this.$gettext('kilometers'),
        time: this.$gettext('Time'),
        duration: this.$gettext('Duration'),
        duration_legend: this.$gettext('Duration (hrs)'),
      },
    };
  },

  watch: {
    mode: 'updateChart',
  },

  created() {
    if (this.document.geometry && this.document.geometry.geom_detail) {
      this.computeCoords();
    }
  },

  mounted() {
    if (this.hasData) {
      d3.then(this.createChart);
    }

    this.debouncedOnResize = debounce(this.onResize, 100);
  },

  beforeDestroy() {
    this.resizeObserver?.unobserve(this.$refs.graph);
  },

  methods: {
    computeCoords() {
      // compute data
      const geom_detail = JSON.parse(this.document.geometry.geom_detail);

      if (geom_detail.type === 'MultiLineString') {
        this.coords = [];
        geom_detail.coordinates.forEach((linestring) => {
          this.coords = this.coords.concat(linestring);
        });
      } else {
        this.coords = geom_detail.coordinates;
      }

      // is there any elevation data
      if (!this.coords.some((coord) => coord.length > 2 && coord[2] !== 0)) {
        return;
      }

      this.timeAvailable = this.coords.every((coord) => coord.length > 3);
      this.hasData = true;
      this.$emit('has-data');
    },

    createChart() {
      const timeAvailable = this.timeAvailable;
      const coords = this.coords;
      const startDate = timeAvailable ? new Date(coords[0][3] * 1000) : null;

      let totalDist = 0;
      this.data = coords.map((coord, i, coords) => {
        const date = timeAvailable ? new Date(coord[3] * 1000) : null;

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
          elapsed: timeAvailable ? date - startDate : undefined,
        };
      });

      // create chart
      const wrapper = this.$refs.graph;

      const size = {
        width: wrapper.offsetWidth,
        height: wrapper.offsetHeight,
      };

      this.margin = {
        top: 40,
        right: 10,
        bottom: 25,
        left: 35,
      };

      const width = size.width - this.margin.left - this.margin.right;
      const height = size.height - this.margin.top - this.margin.bottom;

      // Add an SVG element with the desired dimensions and margin
      this.svg = d3.select(this.$refs.graph).append('svg').attr('width', size.width).attr('height', size.height);
      this.container = this.svg
        .append('g')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

      // Scales and axes
      this.y = d3.scaleLinear().range([height, 0]);
      this.yAxis = d3.axisLeft().scale(this.y).tickFormat(d3.format('.0f'));
      this.y.domain(d3.extent(this.data, (d) => d.ele)).nice();

      this.x1 = d3.scaleLinear().range([0, width]);
      this.x1Axis = d3.axisBottom().scale(this.x1);
      this.x1.domain(d3.extent(this.data, (d) => d.d)).nice();

      if (this.timeAvailable) {
        this.x2 = d3.scaleTime().range([0, width]);
        this.x2Axis = d3
          .axisBottom()
          .scale(this.x2)
          // force display of elapsed time as hrs:mins. It is not datetime!
          .tickFormat((t) => ~~(t / 3600000) + ':' + d3.format('02d')(~~((t % 3600000) / 60000)));

        this.x2.domain(d3.extent(this.data, (d) => d.elapsed)).nice(d3.timeHour);
      }

      this.container
        .append('g')
        .attr('class', 'y axis')
        .call(this.yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text(this.i18n_.elevation_legend);

      this.container
        .append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(this.x1Axis)
        .append('text')
        .attr('x', size.width - this.margin.left - this.margin.right)
        .attr('dy', '-.71em')
        .attr('class', 'x axis legend')
        .style('text-anchor', 'end')
        .text(this.i18n_.distance_legend);

      // data lines
      this.dLine = d3
        .line()
        .x((d) => this.x1(d.d))
        .y((d) => this.y(d.ele));

      if (this.timeAvailable) {
        this.tLine = d3
          .line()
          .x((d) => this.x2(d.elapsed))
          .y((d) => this.y(d.ele));
      }

      // display line path
      this.line = this.container.append('path').datum(this.data).attr('class', 'line').attr('d', this.dLine);

      // Display point information on hover
      this.focusv = this.container
        .append('line')
        .attr('class', 'target')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', size.height - this.margin.bottom - this.margin.top)
        .style('display', 'none');

      this.focush = this.container
        .append('line')
        .attr('class', 'target')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', size.width - this.margin.right - this.margin.left)
        .attr('y2', 0)
        .style('display', 'none');

      this.focus = this.container.append('circle').attr('class', 'circle').attr('r', 4.5).style('display', 'none');

      this.bubble1 = this.container
        .append('text')
        .attr('x', (size.width - this.margin.left - this.margin.right) / 2)
        .attr('dy', '-.71em')
        .attr('class', 'bubble')
        .style('text-anchor', 'middle')
        .style('display', 'none')
        .text('');

      this.bubble2 = this.container
        .append('text')
        .attr('x', (size.width - this.margin.left - this.margin.right) / 2)
        .attr('dy', '-1.71em')
        .attr('class', 'bubble')
        .style('text-anchor', 'middle')
        .style('display', 'none')
        .text('');

      this.container
        .append('rect')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', () => {
          this.focus.style('display', null);
          this.focush.style('display', null);
          this.focusv.style('display', null);
          this.bubble1.style('display', null);
          this.bubble2.style('display', null);
        })
        .on('mouseout', () => {
          this.focus.style('display', 'none');
          this.focush.style('display', 'none');
          this.focusv.style('display', 'none');
          this.bubble1.style('display', 'none');
          this.bubble2.style('display', 'none');
          this.emitMouseOutEvent();
        })
        .on('mousemove', this.mousemove);

      this.resizeObserver = new ResizeObserver(([entry]) => {
        if (entry.contentBoxSize) {
          // Firefox implements `contentBoxSize` as a single content rect, rather than an array
          const contentBoxSize = Array.isArray(entry.contentBoxSize) ? entry.contentBoxSize[0] : entry.contentBoxSize;
          this.debouncedOnResize(contentBoxSize.inlineSize, contentBoxSize.blockSize);
        } else {
          this.debouncedOnResize(entry.contentRect.width, entry.contentRect.height);
        }
      });
      this.resizeObserver.observe(this.$refs.graph);
    },

    onResize(graphWidth, graphHeight) {
      const width = graphWidth - this.margin.left - this.margin.right;
      const height = graphHeight - this.margin.top - this.margin.bottom;

      // recompute axes, lines and resize elements
      this.x1.range([0, width]);
      if (this.timeAvailable) {
        this.x2.range([0, width]);
      }
      const axis = this.mode === 'distance' ? this.x1Axis : this.x2Axis;
      this.container
        .select('.x.axis')
        .call(axis)
        .attr('transform', 'translate(0,' + height + ')');
      this.container.select('.x.axis.legend').attr('x', width);

      this.y.range([height, 0]);
      this.container.select('.y.axis').call(this.yAxis);

      this.line.attr('d', this.mode === 'distance' ? this.dLine : this.tLine);
      this.focush.attr('x2', width);
      this.bubble1.attr('x', (width - this.margin.left - this.margin.right) / 2);
      this.bubble2.attr('x', (width - this.margin.left - this.margin.right) / 2);
      this.container.select('rect.overlay').attr('width', width);
      this.svg
        .attr('width', graphWidth)
        // while on fullscreen, the x axis switch is displayed in top right corner
        .attr('height', !document.fullscreenElement ? graphHeight : graphHeight + this.margin.top);

      this.focus.style('display', 'none');
      this.focush.style('display', 'none');
      this.focusv.style('display', 'none');
      this.bubble1.style('display', 'none');
      this.bubble2.style('display', 'none');
    },

    mousemove(event) {
      const bisectDistance = d3.bisector((d) => d.d).left;
      const bisectDate = d3.bisector((d) => d.elapsed).left;

      const formatDistance = d3.format('.2f');
      const formatDate = d3.timeFormat('%H:%M');
      const formatMinutes = d3.format('02d');
      const formatElevation = d3.format('d');

      const bisect = this.mode === 'distance' ? bisectDistance : bisectDate;
      const x0 =
        this.mode === 'distance'
          ? this.x1.invert(d3.pointer(event, this.container.node())[0])
          : this.x2.invert(d3.pointer(event, this.container.node())[0]);

      const i = bisect(this.data, x0, 1, this.data.length - 1);
      const d0 = this.data[i - 1];
      const d1 = this.data[i];

      const d =
        this.mode === 'distance' ? (x0 - d0.d > d1.d - x0 ? d1 : d0) : x0 - d0.elapsed > d1.elapsed - x0 ? d1 : d0;

      const dy = this.y(d.ele);
      const dx = this.mode === 'distance' ? this.x1(d.d) : this.x2(d.elapsed);

      this.focus.attr('transform', 'translate(' + dx + ',' + dy + ')');
      this.focush.attr('transform', 'translate(0,' + dy + ')');
      this.focusv.attr('transform', 'translate(' + dx + ',0)');

      this.bubble1.text(
        this.i18n_.elevation +
          ' ' +
          formatElevation(d.ele) +
          this.i18n_.meters +
          ' / ' +
          this.i18n_.distance +
          ' ' +
          formatDistance(d.d) +
          this.i18n_.km
      );

      if (this.timeAvailable) {
        const elapsed = d.elapsed / 1000;
        this.bubble2.text(
          this.i18n_.time +
            ' ' +
            formatDate(d.date) +
            ' / ' +
            this.i18n_.duration +
            ' ' +
            ~~(elapsed / 3600) +
            ':' +
            formatMinutes(~~((elapsed % 3600) / 60))
        );
      }

      this.emitMouseMoveEvent(this.coords[d === d0 ? i - 1 : i]);
    },

    updateChart() {
      const nLine = this.mode === 'distance' ? this.dLine : this.tLine;
      const axis = this.mode === 'distance' ? this.x1Axis : this.x2Axis;
      const legend = this.mode === 'distance' ? this.i18n_.distance_legend : this.i18n_.duration_legend;

      this.line.transition().duration(1000).attr('d', nLine);

      d3.select('.x.axis').call(axis);
      d3.select('.x.axis.legend').text(legend);
    },

    emitMouseOutEvent() {
      this.$root.$emit('elevation_profile', 'end');
    },

    emitMouseMoveEvent(coord) {
      this.$root.$emit('elevation_profile', 'move', coord);
    },
  },
};
</script>

<style lang="scss" scoped>
$C2C-orange: red;

::v-deep {
  .elevation-profile-chart {
    height: 300px; // default height on page

    .axis path,
    .axis line {
      fill: none;
      stroke: black;
      shape-rendering: crispEdges;
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
}

:fullscreen .elevation-profile-container {
  position: absolute;
  bottom: 0;
  height: 30%;
  max-height: 350px;
  min-height: 200px;
  width: 100%;
  background-color: white;

  > form {
    position: absolute;
    right: 0;
    z-index: 2;
  }

  .elevation-profile-chart {
    height: 100%;

    ::v-deep svg {
      position: absolute;
    }
  }
}
</style>
