<template>
  <modal-card ref="modalWindow">
    <span slot="title">
      <span v-translate>This tool estimates the technical difficulty of a ski route (ski rating).</span>
    </span>

    <div class="field">
      <label class="label" v-translate>Skiability</label>
      <div class="control">
        <input
          id="c2c-skiability-0"
          name="c2c-skiability"
          class="is-checkradio is-info"
          type="radio"
          v-model="skiability"
          :value="0"
        />
        <label v-translate for="c2c-skiability-0">Wide and constant</label>
      </div>
      <div class="control">
        <input
          type="radio"
          id="c2c-skiability-1"
          name="c2c-skiability"
          class="is-checkradio is-info"
          v-model="skiability"
          :value="0.1"
        />
        <label v-translate for="c2c-skiability-1">1 or 2 complications (steeper or narrow section...)</label>
      </div>

      <div class="control">
        <input
          type="radio"
          id="c2c-skiability-2"
          name="c2c-skiability"
          class="is-checkradio is-info"
          v-model="skiability"
          :value="0.2"
        />
        <label v-translate for="c2c-skiability-2">Very complex (steps, narrow sections, ridges...)</label>
      </div>
    </div>

    <div class="field">
      <label class="label" v-translate>Average slope (degrees)</label>
      <div class="control">
        <input v-model="slope" class="input" :placeholder="$gettext('Average slope in degree')" type="number" />
      </div>
      <p class="help is-danger" v-if="errorSlope" v-translate>The slope must be between 0 and 80 deg</p>
    </div>

    <div class="field">
      <label class="label" v-translate>height_diff</label>
      <div class="control">
        <input v-model="elevation" class="input" type="number" min="50" max="3000" />
      </div>
      <p class="help is-danger" v-if="errorElevation" v-translate>The slope must be between 50 and 3000m high</p>
    </div>

    <h1 class="title is-1 has-text-centered" v-if="rating">
      <span v-translate>Suggested rating</span>
      <br />
      <span class="has-text-success">
        {{ rating }}
      </span>
    </h1>

    <footer slot="footer">
      <button class="button is-success" type="button" @click="setResult" :disabled="!rating" v-translate>Ok</button>
      <button class="button is-default" type="button" @click="$refs.modalWindow.hide()" v-translate>Cancel</button>
    </footer>
  </modal-card>
</template>

<script>
export default {
  data() {
    return {
      skiability: 0,
      slope: null,
      elevation: 50,
    };
  },

  computed: {
    errorSlope() {
      return Number.isNaN(this.slope) || this.slope < 0 || this.slope > 80.0;
    },

    errorElevation() {
      return (
        (Number.isNaN(this.elevation) || this.elevation < 50.0 || this.elevation > 3000.0) && this.elevation !== null
      );
    },

    rating() {
      if (this.errorSlope || this.errorElevation) {
        return null;
      }

      let inter = Math.tan((Math.PI * this.slope) / 180) + 0.1 * Math.log(this.elevation);
      inter += this.skiability * (inter - 1);

      const diff = (1 + this.skiability) * this.elevation;

      if (this.slope <= 17 && diff < 400) {
        return '1.1';
      }

      if (this.slope <= 23 && diff < 650) {
        return '1.2';
      }

      if (this.slope < 30 && diff < 800) {
        return '1.3';
      }

      if ((this.slope < 35 && diff < 800) || (this.slope < 23 && diff > 800)) {
        return '2.1';
      }

      if (this.slope < 35 && diff <= 950) {
        return '2.2';
      }

      if (this.slope < 35 && diff > 950) {
        return '2.3';
      }

      if (this.slope >= 35 && this.slope <= 40 && diff < 650) {
        return '3.1';
      }

      if (this.slope >= 35 && this.slope <= 40 && diff <= 900) {
        return '3.2';
      }

      if (this.slope >= 35 && this.slope <= 40 && diff > 900) {
        return '3.3';
      }

      if (inter < 0.98) {
        return '1.1';
      }

      if (inter >= 0.98 && inter < 1.02) {
        return '1.2';
      }

      if (inter >= 1.03 && inter < 1.09) {
        return '+1.3';
      }

      if (inter >= 1.09 && inter < 1.18) {
        return '+2.1';
      }

      if (inter >= 1.18 && inter < 1.24) {
        return '2.2';
      }

      if (inter >= 1.24 && inter < 1.3) {
        return '2.3';
      }

      if (inter >= 1.3 && inter < 1.34) {
        return '3.1';
      }

      if (inter >= 1.34 && inter < 1.39) {
        return '3.2';
      }

      if (inter >= 1.39 && inter < 1.42) {
        return '3.3';
      }

      if (inter >= 1.42 && inter < 1.46) {
        return '4.1';
      }

      if (inter >= 1.46 && inter < 1.52) {
        return '4.2';
      }

      if (inter >= 1.52 && inter < 1.575) {
        return '4.3';
      }

      if (inter >= 1.575 && inter < 1.67) {
        return '5.1';
      }

      if (inter >= 1.67 && inter < 1.745) {
        return '5.2';
      }

      if (inter >= 1.745 && inter < 1.81) {
        return '5.3';
      }

      if (inter >= 1.81 && inter < 1.95) {
        return '5.4';
      }

      if (inter >= 1.95 && inter < 2.09) {
        return '5.5';
      }

      if (inter >= 2.09 && inter < 2.25) {
        return '5.6';
      }

      if (inter >= 2.25 && inter < 2.4) {
        return '5.7';
      }

      return '5.8';
    },
  },

  methods: {
    show() {
      this.$refs.modalWindow.show();
    },

    setResult() {
      this.$emit('input', this.rating);
      this.$refs.modalWindow.hide();
    },
  },
};
</script>
