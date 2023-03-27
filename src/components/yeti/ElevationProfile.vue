<template>
  <div ref="container" class="elevation-profile-container">
    <div ref="graph" class="elevation-profile-chart" />
  </div>
</template>

<script>
import Yetix from '@/components/yeti/Yetix';
import debounce from '@/js/debounce';
import d3 from '@/js/libs/d3';
import ol from '@/js/libs/ol';

export default {
  props: {
    features: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      i18n_: {
        elevation_legend: this.$gettext('Elevation (m)'),
        distance_legend: this.$gettext('Distance (km)'),
      },
    };
  },

  watch: {
    features() {
      this.updateChart();
    },
  },

  mounted() {
    d3.then(this.createChart);

    this.debouncedOnResize = debounce(this.onResize, 100);

    Yetix.$on('showFeature', this.showFeature);
    Yetix.$on('hideFeature', this.hideFeature);
  },

  beforeDestroy() {
    this.resizeObserver?.unobserve(this.$refs.graph);
  },

  methods: {
    showFeature(index) {
      this.container
        .selectAll('.area')
        .select(function (d, i) {
          if (index === i) {
            return this;
          }
        })
        .classed('area-highlighted', true);
    },
    hideFeature() {
      this.container.selectAll('.area').classed('area-highlighted', false);
    },
    computeCoords() {
      this.coords = this.features.map((feature) => {
        return feature.getGeometry().getCoordinates();
      });
      this.concatCoords = this.coords.reduce((a, b) => {
        return a.concat(b);
      }, []);

      this.updateData();
    },

    updateData() {
      let totalDist = 0;
      this.data = this.coords.map((c) => {
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

          return {
            ele: coord[2] ?? 0,
            d: totalDist,
          };
        });
      });

      this.concatData = this.data.reduce((a, b) => {
        return a.concat(b);
      }, []);

      this.areasData = this.data
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
    },

    createChart() {
      // first, compute coords
      this.computeCoords();

      const wrapper = this.$refs.graph;

      this.size = {
        width: wrapper.offsetWidth,
        height: wrapper.offsetHeight,
      };

      this.margin = {
        top: 8,
        right: 10,
        bottom: 25,
        left: 15,
      };

      const width = this.size.width - this.margin.left - this.margin.right;
      const height = this.size.height - this.margin.top - this.margin.bottom;

      // Add an SVG element with the desired dimensions and margin
      this.svg = d3.select(this.$refs.graph).append('svg').attr('width', '100%').attr('height', this.size.height);
      this.container = this.svg
        .append('g')
        .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

      // areas container
      this.container.append('g').attr('class', 'areas');

      // Scales and axes
      this.scaleX = d3.scaleLinear().range([0, width]);
      this.axisX = d3.axisBottom().scale(this.scaleX);

      this.scaleY = d3.scaleLinear().range([height, 0]);
      this.axisY = d3.axisRight().scale(this.scaleY).ticks(5).tickFormat(d3.format('.0f'));

      // scales containers
      this.container.append('g').attr('class', 'y axis');
      this.container.append('g').attr('class', 'x axis');

      // scales legends
      this.container
        .select('.axis.x')
        .attr('transform', 'translate(0,' + height + ')')
        .call(this.axisX)
        .append('text')
        .attr('x', this.size.width - this.margin.left - this.margin.right)
        .attr('dy', '-.5em')
        .attr('class', 'legend')
        .style('text-anchor', 'end')
        .text(this.i18n_.distance_legend);

      this.container
        .select('.axis.y')
        //.attr('transform', 'translate(0, 10)')
        .call(this.axisY)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '-1em')
        .attr('class', 'legend')
        .style('text-anchor', 'end')
        .text(this.i18n_.elevation_legend);

      // lines container
      this.container.append('g').attr('class', 'elevation-lines');

      // then, update chart
      this.updateChart();

      this.focus = this.container.append('circle').attr('class', 'circle').attr('r', 4.5).style('display', 'none');

      this.container
        .append('rect')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .on(
          'mouseover',
          () => {
            this.focus.style('display', null);
          },
          { passive: true }
        )
        .on(
          'mouseout',
          () => {
            this.focus.style('display', 'none');
            this.emitCursorEndEvent();
          },
          { passive: true }
        )
        .on('mousemove', this.setCursor, { passive: true });

      // update the graph when it is resized
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

    updateChart() {
      this.computeCoords();

      // update axes
      this.scaleX.domain(d3.extent(this.concatData, (d) => d.d)).nice();
      this.container.select('.axis.x').call(this.axisX);

      this.scaleY.domain(d3.extent(this.concatData, (d) => d.ele)).nice();
      this.container.select('.axis.y').call(this.axisY);
      // remove zeroes from y axis
      this.container
        .select('.axis.y')
        .select('.tick')
        .filter((d, a, b) => {
          let first = b[0];
          if (first) {
            let transform = first.attributes.transform.value;
            transform = transform.replace('transform(', '').replace(')', '');
            let values = transform.split(',');
            let posy = values[1];
            if (posy > this.size.height - this.margin.top - this.margin.bottom) {
              return true;
            }
          }
        })
        .remove();

      this.line = d3
        .line()
        .x((d) => this.scaleX(d.d))
        .y((d) => this.scaleY(d.ele));

      this.area = d3
        .area()
        .x0((d) => this.scaleX(d.min))
        .x1((d) => {
          // set minimum width for lines
          let minWidth = d.max - d.min < 1 ? 5 : 0;
          return this.scaleX(d.max) + minWidth;
        })
        .y((d, i) => (i === 0 ? 0 : this.size.height - this.margin.top - this.margin.bottom));

      // build areas
      this.container
        .select('.areas')
        .selectAll('path')
        .data(this.areasData)
        .join('path')
        .attr('class', 'area')
        .attr('d', this.area);

      // build lines
      this.container
        .select('.elevation-lines')
        .selectAll('path')
        .data(this.data)
        .join('path')
        .attr('class', 'line')
        .attr('d', this.line);
    },

    onResize(graphWidth, graphHeight) {
      const width = graphWidth - this.margin.left - this.margin.right;
      const height = graphHeight - this.margin.top - this.margin.bottom;

      // recompute axes, lines and resize elements
      this.scaleX.range([0, width]);
      this.scaleY.range([height, 0]);
      // update overlay
      this.container.select('rect.overlay').attr('width', width);

      this.updateChart();
    },

    setCursor(mouseMoveEvent) {
      const bisectDistance = d3.bisector((d) => d.d).left;

      const x0 = this.scaleX.invert(d3.pointer(mouseMoveEvent, this.container.node())[0]);

      const i = bisectDistance(this.concatData, x0, 1, this.concatData.length - 1);
      const d0 = this.concatData[i - 1];
      const d1 = this.concatData[i];

      const d = x0 - d0.d > d1.d - x0 ? d1 : d0;

      const dy = this.scaleY(d.ele);
      const dx = this.scaleX(d.d);

      this.focus.attr('transform', 'translate(' + dx + ',' + dy + ')');

      this.emitCursorMoveEvent(this.concatCoords[d === d0 ? i - 1 : i]);
    },
    emitCursorEndEvent() {
      Yetix.$emit('elevationProfile', 'cursor_end');
    },
    emitCursorMoveEvent(coord) {
      Yetix.$emit('elevationProfile', 'cursor_move', coord);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/sass/variables';

$C2C-orange: red;

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
    stroke: $C2C-orange;
    stroke-width: 3px;
    stroke-linejoin: round;
  }

  .circle {
    fill: yellow;
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

  .area {
    fill: none;
  }

  .area-highlighted {
    fill: rgba(255, 255, 0, 0.75);
  }
}
</style>
