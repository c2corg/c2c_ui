<template>
  <div>
    <div ref="container">
      <div ref="graph" class="elevation-profile-chart" />
    </div>
    <div class="elevation-generate-panel">
      <h4 class="title is-6" v-translate>Generate new elevations</h4>
      <div>
        <input-checkbox v-model="interpolate" class="mt-2">
          <span v-translate>Add more points</span>
        </input-checkbox>
        <div v-if="interpolate" class="control-subpanel">
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
      <div>
        <input-checkbox v-model="override" class="mt-2">
          <span v-translate>Force elevations</span>
        </input-checkbox>
      </div>
      <info type="help" class="column">
        <p v-translate>If checked, all elevations will be recomputed and current values will be lost</p>
      </info>
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

<script>
import simplify from './map-layers/simplify';

import Info from '@/components/yeti/Info.vue';
import Yetix from '@/components/yeti/Yetix';
import debounce from '@/js/debounce';
import d3 from '@/js/libs/d3';
import ol from '@/js/libs/ol';

const MIN_INTERPOLATE_VALUE = 5;

export default {
  components: { Info },
  props: {
    features: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      data: [],
      loading: false,
      interpolate: false,
      interpolateValue: 50,
      override: false,
      i18n_: {
        elevation_legend: this.$gettext('Elevation (m)'),
        distance_legend: this.$gettext('Distance (km)'),
      },
      errors: {
        actionDisabled: this.$gettext('Action is disabled. You must confirm simplified geometry first.'),
        fromApi: this.$gettext('One or more route could not be processed:'),
        interpolateValue: this.$gettext('Interpolate value should be a number > 0'),
        overrideElevation: this.$gettext(
          'Features already have elevations. Enable "Force elevations" if you want to override them.'
        ),
        tooMuchPoints: this.$gettext(
          'One or more line chunks will generate more than 3000 points. Adjust distance to generate less points.'
        ),
      },
    };
  },
  computed: {
    areas() {
      return Yetix.areas;
    },
    fetchWpsAlti() {
      return Yetix.fetchWpsAlti;
    },
    validSimplifyTolerance() {
      return Yetix.validSimplifyTolerance;
    },
    atLeastOneFeatureHas3D() {
      let features = this.features.filter((feature) => {
        let coords = feature.getGeometry().getCoordinates();
        return !coords.some((coord) => coord.length >= 3 && coord[2] !== 0);
      });
      return features.length === 0;
    },
    atLeastOneLineChunkHasTooMuchPoints() {
      if (this.interpolateValueInvalid) {
        return false;
      }
      return this.data.filter((d) => {
        return (d[d.length - 1].localD * 1000) / this.interpolateValue > 3000;
      }).length;
    },
    interpolateValueInvalid() {
      // type number is empty string when not number
      return this.interpolateValue === 0 || this.interpolateValue === '';
    },
    routeIntersectsYetiAreas() {
      if (this.areas.length) {
        for (let feature of this.features) {
          let coords = feature.getGeometry().getCoordinates();
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
            let inside = this.areas[0].geometry.intersectsCoordinate(coord);
            // return when at least one point if outside
            if (!inside) {
              return true;
            }
          }
        }
      }
      return false;
    },
  },
  watch: {
    features() {
      this.updateChart(true);
    },
  },
  mounted() {
    // debounce creating chart
    debounce(() => {
      d3.then(this.createChart);
    }, 10)();

    this.debouncedOnResize = debounce(this.onResize, 100);

    Yetix.$on('showFeature', this.showFeature);
    Yetix.$on('hideFeature', this.hideFeature);
  },
  beforeDestroy() {
    this.resizeObserver?.unobserve(this.$refs.graph);
  },
  methods: {
    onCalculateElevations() {
      // deal with errors first
      if (this.validSimplifyTolerance) {
        return window.alert(this.errors.actionDisabled);
      }
      if (this.atLeastOneLineChunkHasTooMuchPoints) {
        return window.alert(this.errors.tooMuchPoints);
      }
      if (this.interpolateValueInvalid) {
        return window.alert(this.errors.interpolateValue);
      }
      if (!this.override && this.atLeastOneFeatureHas3D) {
        return window.alert(this.errors.overrideElevation);
      }
      // start loading
      this.loading = true;
      // and defer (next cycle)
      setTimeout(() => {
        if (this.override) {
          // when elevation is forced, start by removing all elevations
          this.removeAllElevations();
        }

        // interpolateValue is 5 meters min, or 0 if not checked
        let interpolateValue = this.interpolate ? Math.max(MIN_INTERPOLATE_VALUE, this.interpolateValue) : 0;

        // build promises for each http request (one per line chunk)
        let promises = [];
        // for each filtered features
        this.features.forEach((feature) => {
          let points = feature.getGeometry().clone().transform('EPSG:3857', 'EPSG:4326').getCoordinates();
          promises.push(
            this.fetchWpsAlti(points, interpolateValue).then(({ data }) => {
              // if we got features from api, set new geometry to feature
              if (data.features) {
                // first transform coords
                let coords = data.features[0].geometry.coordinates.map((coord) => {
                  return ol.proj.transform(coord, 'EPSG:4326', 'EPSG:3857');
                });
                // replace this feature coordinates
                feature.getGeometry().setCoordinates(coords);
              }
              // return promise (to deal with errors)
              return data;
            })
          );
        });
        // when all requests finished
        Promise.all(promises).then((promises) => {
          // stop loading
          this.loading = false;
          // emit featureUpdated: routeLayer will update state.features
          Yetix.$emit('featureUpdated');

          // errors ?
          // if we got status=error, concatenate all errors, and alert
          let errors = promises
            .filter((promise) => promise.status && promise.status === 'error')
            .map((error) => {
              return error.message;
            });
          if (errors.length) {
            window.alert(this.errors.fromApi + '\n' + errors.join('\n'));
          }
        });
      }, 10);
    },
    removeAllElevations() {
      this.features.forEach((feature) => {
        let coords = feature.getGeometry().getCoordinates();
        coords = coords.map((coord) => {
          coord[2] = 0;
          return coord;
        });
        feature.getGeometry().setCoordinates(coords);
      });
      Yetix.$emit('featureUpdated');
    },
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
      this.concatCoords = this.coords.flat();

      this.updateData();
    },
    updateData() {
      let totalDist = 0;
      this.data = this.coords.map((c) => {
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

      this.concatData = this.data.flat();

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
      this.container.append('g').attr('class', 'areas-lines');

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

      // altitude popup
      this.popupAltitude = this.container
        .append('g')
        .attr('class', 'popup')
        .attr('x', this.margin.left + 5)
        .style('display', 'none');
      this.popupAltitudeRect = this.popupAltitude.append('rect').attr('y', -8);
      this.popupAltitudeText = this.popupAltitude.append('text').attr('dx', 5).attr('dy', 4);

      this.container
        .append('rect')
        .attr('class', 'overlay')
        .attr('width', width)
        .attr('height', height)
        .on(
          'mouseover',
          () => {
            this.focus.style('display', null);
            this.popupAltitude.style('display', null);
          },
          { passive: true }
        )
        .on(
          'mouseout',
          () => {
            this.focus.style('display', 'none');
            this.popupAltitude.style('display', 'none');
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
    updateChart(force = false) {
      if (force) {
        this.computeCoords();
      }

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

      this.areaLine = d3
        .line()
        .x((d) => Math.round(this.scaleX(d.max)) + 0.5)
        .y((d, i) => (i === 0 ? 0 : this.size.height - this.margin.top - this.margin.bottom));

      // build areas
      this.container
        .select('.areas')
        .selectAll('path')
        .data(this.areasData)
        .join('path')
        .attr('class', 'area')
        .attr('d', this.area);

      // build areas line (dashed)
      let areasDataForLines = structuredClone(this.areasData);
      // remove last one
      areasDataForLines.pop();
      this.container
        .select('.areas-lines')
        .selectAll('path')
        .data(areasDataForLines)
        .join('path')
        .attr('d', this.areaLine);

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

      const dy = Math.round(this.scaleY(d.ele));
      const dx = Math.round(this.scaleX(d.d));

      this.focus.attr('transform', 'translate(' + dx + ',' + dy + ')');
      this.popupAltitude.attr('transform', 'translate(0,' + dy + ')');
      let bbox = this.popupAltitudeText.node().getBBox();
      this.popupAltitudeRect.attr('width', Math.round(bbox.width + 10)).attr('height', Math.round(bbox.height));

      this.popupAltitudeText.text(Math.round(d.ele) + ' m');

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

  .popup {
    font-size: 12px;
    font-weight: bold;
    fill: $primary;
  }

  .popup text {
    fill: yellow;
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
