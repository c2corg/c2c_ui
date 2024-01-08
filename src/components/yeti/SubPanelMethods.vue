<template>
  <div class="yeti-subpanel">
    <sub-panel-title><span v-translate>Methods</span></sub-panel-title>
    <div class="columns is-mobile yetitabs">
      <div v-for="item of Object.keys(methods)" :key="item" class="column yetitab">
        <div class="control yetitab-control" :class="{ 'yetitab-control--selected': method.type === item }">
          <input
            :id="'c2c-method-' + item"
            type="radio"
            name="method"
            class="is-checkradio is-primary"
            :value="item"
            :checked="item === method.type"
            :disabled="item === 'mrd' ? bra.high == 4 || bra.low == 4 : false"
            @change="onChange($event, 'type')"
          />
          <label :for="'c2c-method-' + item" class="yetitab-label" @click="warnAboutMethodBra(item)">
            {{ methods[item][0] }}
            <span class="is-size-7" :class="{ 'has-text-grey': item !== method.type }">{{ methods[item][1] }}</span>
          </label>
        </div>
      </div>
    </div>

    <div v-show="method.type == 'mrd'">
      <p>
        <span v-translate>With the</span>
        <strong v-translate>Beginner Reduction Method</strong>
        <span v-translate>
          (MRD), you do not have to enter any parameters other than the danger level(s) given by the avalanche bulletin.
        </span>
      </p>
      <info type="help">
        <p v-translate>
          As the name suggests, this method is intended for beginners. Therefore, the safety margin must be particularly
          important. No parameter other than the danger level is specified. Orientation is ignored.
        </p>
      </info>

      <table class="yetiform-danger">
        <tr>
          <td><img src="@/assets/img/yeti/levels-danger.svg#level1" loading="lazy" /></td>
          <td><strong v-translate>Danger rating - low</strong></td>
          <td v-translate>I must not use slopes > 40°</td>
        </tr>
        <tr>
          <td><img src="@/assets/img/yeti/levels-danger.svg#level2" loading="lazy" /></td>
          <td><strong v-translate>Danger rating - moderate</strong></td>
          <td v-translate>I must not use slopes > 35°</td>
        </tr>
        <tr class="multiline">
          <td><img src="@/assets/img/yeti/levels-danger.svg#level3" loading="lazy" /></td>
          <td><strong v-translate>Danger rating - considerable</strong></td>
          <td>
            <span v-translate>I must not use slopes > 30°</span>
            <br />
            <small v-translate>including dominant slopes</small>
          </td>
        </tr>
        <tr>
          <td><img src="@/assets/img/yeti/levels-danger.svg#level4" loading="lazy" /></td>
          <td><strong v-translate>Danger rating - high to very high</strong></td>
          <td v-translate>I choose to cancel the outing</td>
        </tr>
      </table>
    </div>

    <div v-show="method.type == 'mre'">
      <p>
        <span v-translate>With the</span>
        <strong v-translate>Elementary Reduction Method</strong>
        <span v-translate>
          (MRE), you can enter the sectors of the compass rose that are reported as critical in the avalanche bulletin.
        </span>
      </p>

      <input-orientation
        :value="method.orientation"
        @input="onChange($event, 'orientation')"
        class="has-text-centered mb-2"
      />

      <info v-if="method.orientation.length != 0">
        <span v-translate key="tr1">Orientations</span>: {{ method.orientation.join(', ') }}
      </info>
      <info type="warning" v-else>
        <span v-translate key="tr2">No orientation selected</span>
      </info>

      <info type="help">
        <p v-translate>
          Danger level from the avalanche bulletin applies to all orientations. The compass rose distinguishes the most
          critical sectors presenting an increased risk.
        </p>
      </info>

      <table class="yetiform-danger">
        <tr class="multiline">
          <td><img src="@/assets/img/yeti/levels-danger.svg#level1" loading="lazy" /></td>
          <td><strong v-translate>Danger rating - low</strong></td>
          <td>
            <span v-translate>Stay careful while skiing</span>
            <br />
            <small v-translate>risk of a rough fall on hard snow</small>
          </td>
        </tr>
        <tr>
          <td><img src="@/assets/img/yeti/levels-danger.svg#level2" loading="lazy" /></td>
          <td><strong v-translate>Danger rating - moderate</strong></td>
          <td v-translate>I must not use slopes > 40°</td>
        </tr>
        <tr class="multiline">
          <td><img src="@/assets/img/yeti/levels-danger.svg#level3" loading="lazy" /></td>
          <td><strong v-translate>Danger rating - considerable</strong></td>
          <td>
            <span v-translate>I must not use slopes > 35°</span>
            <br />
            <small v-translate>including dominant slopes</small>
          </td>
        </tr>
        <tr class="multiline">
          <td><img src="@/assets/img/yeti/levels-danger.svg#level4" loading="lazy" /></td>
          <td><strong v-translate>Danger rating - high</strong></td>
          <td>
            <span v-translate>I must not use slopes > 30°</span>
            <br />
            <small v-translate>including dominant slopes</small>
          </td>
        </tr>
        <tr>
          <td><img src="@/assets/img/yeti/levels-danger.svg#level4" loading="lazy" /></td>
          <td><strong v-translate>Danger rating - very high</strong></td>
          <td v-translate>I choose to cancel the outing</td>
        </tr>
      </table>
    </div>

    <div v-show="method.type == 'mrp'">
      <p>
        <span v-translate>With the</span>
        <strong v-translate>Professional Reduction Method</strong>
        <span v-translate>
          (MRP), you can refine the hazard potential, set group size and any precautionary measures being considered.
        </span>
      </p>

      <h3 class="title is-3" v-translate>Hazard potential</h3>
      <ul class="potential-danger-labels has-text-black">
        <li
          v-for="label of potentialDangerLabels"
          :key="label.text"
          :disabled="!bra.high || label.text < potentialDangerOptions.min || label.text > potentialDangerOptions.max"
          :selected="method.potentialDanger == label.text"
          class="potential-danger-label is-size-5"
          @click="onChange(label.text, 'potentialDanger')"
        >
          <span :class="{ 'is-size-3 has-text-weight-bold': label.val }">
            {{ label.text }}
          </span>
        </li>
      </ul>

      <info v-if="method.potentialDanger">
        <span v-translate key="tr1">Hazard potential:</span>
        {{ method.potentialDanger }}
        (<span v-translate>Danger level:</span> {{ bra.high }})
      </info>
      <info type="warning" v-else>
        <span v-translate key="tr2">No selected hazard potential. Set danger level first.</span>
      </info>

      <info type="help">
        <p v-translate>
          The hazard potential is calculated from the danger level of the avalanche bulletin. It can be fine-tuned by
          selecting a potential within the danger level’s corresponding range. For example: the avalanche bulletin
          evokes a danger 3 just after a period in danger 4. We can then indicate a hazard potential of 12 instead of 8.
        </p>
      </info>

      <p>
        <input-checkbox :value="method.wetSnow" @input="onChange($event, 'wetSnow')">
          <span v-translate>Wet snow: orientation not taken into account</span>
        </input-checkbox>
      </p>

      <info type="help">
        <p v-translate>Be careful, in wet snow, no factor to reduce orientation or attendance can be applied.</p>
      </info>

      <h3 class="title is-3" v-translate>Group</h3>

      <ul>
        <li class="control" v-for="(item, i) of groupSizes" :key="i">
          <input
            :id="'c2c-group-size-' + i"
            type="radio"
            name="groupSize"
            class="is-checkradio is-primary"
            :value="item.value"
            :checked="item.value === method.groupSize"
            @change="onChange($event, 'groupSize')"
          />
          <label :for="'c2c-group-size-' + i">{{ item.text }}</label>
        </li>
      </ul>

      <info type="help">
        <p v-translate>Group size</p>
        <ul class="content-ul">
          <li v-translate>Large group = 5 people and more</li>
          <li v-translate>Small group = 2 to 4 people</li>
        </ul>
        <p v-translate>Load shedding distance</p>
        <ul class="content-ul">
          <li v-translate>10 meters minimum while ascending</li>
          <li v-translate>50 meters while descending</li>
        </ul>
      </info>

      <p v-translate>
        The “slope traveled frequently” factor is not taken into account by the application, as it is often difficult to
        ascertain when preparing for an outing.
      </p>
    </div>
  </div>
</template>

<script>
import Info from '@/components/yeti/Info.vue';
import SubPanelTitle from '@/components/yeti/SubPanelTitle.vue';
import Yetix from '@/components/yeti/Yetix';

const DANGER = {
  min: 1,
  max: 16,
  bra: [
    { min: 1, max: 2, val: 2 },
    { min: 3, max: 6, val: 4 },
    { min: 6, max: 12, val: 8 },
    { min: 13, max: 16, val: 16 },
  ],
};

export default {
  components: { Info, SubPanelTitle },
  data() {
    return {
      methods: {
        mrd: ['MRD', this.$gettext('Beginner')],
        mre: ['MRE', this.$gettext('Elementary')],
        mrp: ['MRP', this.$gettext('Expert')],
      },
      groupSizes: [
        {
          value: 1,
          text: this.$gettext('No reduction factor'),
        },
        {
          value: 2.1,
          text: this.$gettext('Large group with load shedding distance'),
        },
        {
          value: 2.2,
          text: this.$gettext('Small group without distance'),
        },
        {
          value: 3,
          text: this.$gettext('Small group with load shedding distance'),
        },
      ],
    };
  },
  computed: {
    bra() {
      return Yetix.bra;
    },
    method() {
      return Yetix.method;
    },
    potentialDangerLabels() {
      const result = [];
      for (let i = DANGER.min; i <= DANGER.max; i++) {
        const data = { text: i };
        if (i === 2 || i === 4 || i === 8 || i === 16) {
          data.val = i;
        }
        result.push(data);
      }

      return result;
    },
    potentialDangerOptions() {
      if (!this.bra.high) {
        return { val: undefined, min: 1, max: 16 };
      }

      return DANGER.bra[this.bra.high - 1];
    },
  },
  watch: {
    'bra.high': 'onBraChange',
  },
  methods: {
    onChange(event, prop) {
      let value = null;
      if (prop === 'orientation' || prop === 'wetSnow' || prop === 'potentialDanger') {
        value = event;
      } else {
        value = event.target.value;
      }
      Yetix.setMethod(prop, value);
    },
    warnAboutMethodBra(item) {
      this.$emit('warn-about-method-bra', item);
    },
    onBraChange() {
      this.onChange(this.potentialDangerOptions.val, 'potentialDanger');
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

p:not(:last-child),
ul:not(:last-child),
table:not(:last-child) {
  margin-bottom: 1rem;
}

.yetiform-danger {
  width: 100%;
  table-layout: fixed;
  color: $dark;

  tr + tr {
    border-top: 1px solid $grey-lighter;
  }

  td {
    vertical-align: middle;
    height: 45px;
  }

  .multiline td {
    vertical-align: baseline;
  }

  td:first-child {
    width: 60px;
  }

  td:first-child + td {
    width: 40%;
  }

  td img {
    vertical-align: -12px;
    height: 35px;
  }
}

.yetitabs {
  margin: 0;
  padding: 0.75rem 0;
}

.yetitab {
  padding: 0;
}

.yetitab-control {
  .yetitab-label {
    display: block;
    margin: 0;
    padding: 0.25rem;
    padding-left: 2rem;
    border: 1px solid transparent;
    border-radius: 4px;

    &:hover,
    &:focus {
      border-color: $grey-lighter;
    }

    &.yetitab-label:before {
      top: 0.25rem !important;
      left: 0.25rem !important;
    }
    &.yetitab-label:after {
      top: 0.75rem !important;
      left: 0.75rem !important;
    }
  }
}

.yetitab-control--selected {
  .yetitab-label {
    color: $primary;
    border-color: $primary;

    &:hover,
    &:focus {
      border-color: $primary;
    }
  }
}

@media screen and (max-width: 490px),
  screen and (min-width: $tablet) and (max-width: 970px),
  screen and (min-width: $desktop) and (max-width: 1180px),
  screen and (min-width: $widescreen) and (max-width: 1370px),
  screen and (min-width: $fullhd) and (max-width: 1650px) {
  .yetitabs {
    flex-wrap: wrap;
  }
  .yetitab {
    flex: 0 0 50%;
  }
  .yetiform-danger {
    tr,
    td {
      display: block;
    }
    tr {
      padding: 0.5em 0;
    }
    td:first-child {
      float: left;
    }
    td:first-child ~ td {
      height: auto;
      width: calc(100% - 60px);
      margin-left: 60px;
    }
  }
}

.potential-danger-labels {
  display: flex;
  align-items: stretch;
  user-select: none;
  background: linear-gradient(
    to right,
    #bfe12b,
    #bfe12b 12%,
    #fff200 20%,
    #fff200 32%,
    #f68712 40%,
    #f68712 72%,
    #ed1c24 80%,
    #ed1c24 95%,
    #c01a2c
  );

  .potential-danger-label {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1 1 20px;
    text-align: center;
    border: 3px solid transparent;

    &[disabled] {
      cursor: not-allowed;
      pointer-events: none;
      background-color: rgba(255, 255, 255, 0.8);
      color: grey;
    }

    &[selected] {
      border-color: black;
    }
  }
}
</style>
