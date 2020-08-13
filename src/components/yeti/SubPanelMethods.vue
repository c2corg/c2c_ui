<template>
  <div class="yeti-subpanel panelMethodes">
    <subPanelTitle>Méthodes</subPanelTitle>
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
            <span class="yetiform-info">{{ methods[item][1] }}</span>
          </label>
        </div>
      </div>
    </div>

    <div v-show="method.type == 'mrd'">
      <p>
        Avec la <strong>méthode de réduction pour débutant</strong> (MRD), vous n’avez pas d’autres paramètres à entrer
        que le (ou les) niveau(x) de danger donné par le BRA.
      </p>
      <div class="yetiform-note">
        <p>
          Comme son nom l’indique, cette méthode est destinée aux pratiquants débutants. De ce fait, la marge de
          sécurité se doit d'être très importante. On ne spécifie pas d’autre paramètre que le niveau de danger du BRA.
          Il n’est pas tenu compte de l’orientation.
        </p>
      </div>

      <table class="yetiform-danger">
        <tr>
          <td><img src="@/assets/img/yeti/levels-danger.svg#level1" /></td>
          <td><strong>Danger faible</strong></td>
          <td>Je renonce aux pentes > 40°</td>
        </tr>
        <tr>
          <td><img src="@/assets/img/yeti/levels-danger.svg#level2" /></td>
          <td><strong>Danger limité</strong></td>
          <td>Je renonce aux pentes > 35°</td>
        </tr>
        <tr class="multiline">
          <td><img src="@/assets/img/yeti/levels-danger.svg#level3" /></td>
          <td><strong>Danger marqué</strong></td>
          <td>Je renonce aux pentes > 30° <br /><small>y compris les pentes qui me dominent</small></td>
        </tr>
        <tr>
          <td><img src="@/assets/img/yeti/levels-danger.svg#level4" /></td>
          <td><strong>Danger fort à très fort</strong></td>
          <td>Je renonce à sortir</td>
        </tr>
      </table>
    </div>

    <div v-show="method.type == 'mre'">
      <p>
        Avec la <strong>méthode de réduction élémentaire</strong> (MRE), vous pouvez saisir les secteurs de la rose des
        vents signalés comme critique dans le BRA.
      </p>

      <input-orientation
        :value="method.orientation"
        @input="onChange($event, 'orientation')"
        class="has-text-centered"
      />
      <p v-if="method.orientation.length != 0" class="yetiform-info">
        Orientations: {{ method.orientation.join(', ') }}
      </p>
      <p v-else class="yetiform-info">Pas d’orientations sélectionnées</p>

      <div class="yetiform-note">
        <p>
          Le niveau de danger du BRA concerne toutes les orientations. La rose des vents distingue les secteurs les plus
          critiques présentant un risque accru.
        </p>
      </div>

      <table class="yetiform-danger">
        <tr class="multiline">
          <td><img src="@/assets/img/yeti/levels-danger.svg#level1" /></td>
          <td><strong>Danger faible</strong></td>
          <td>Skier avec prudence <br /><small>risque de chute grave sur neige dure</small></td>
        </tr>
        <tr>
          <td><img src="@/assets/img/yeti/levels-danger.svg#level2" /></td>
          <td><strong>Danger limité</strong></td>
          <td>Je renonce aux pentes > 40°</td>
        </tr>
        <tr class="multiline">
          <td><img src="@/assets/img/yeti/levels-danger.svg#level3" /></td>
          <td><strong>Danger marqué</strong></td>
          <td>Je renonce aux pentes > 35° <br /><small>y compris les pentes qui me dominent</small></td>
        </tr>
        <tr class="multiline">
          <td><img src="@/assets/img/yeti/levels-danger.svg#level4" /></td>
          <td><strong>Danger fort</strong></td>
          <td>Je renonce aux pentes > 30° <br /><small>y compris les pentes qui me dominent</small></td>
        </tr>
        <tr>
          <td><img src="@/assets/img/yeti/levels-danger.svg#level4" /></td>
          <td><strong>Danger très fort</strong></td>
          <td>Je renonce à sortir</td>
        </tr>
      </table>
    </div>

    <div v-show="method.type == 'mrp'">
      <p>
        Avec la <strong>méthode de réduction professionnelle</strong> (MRP), vous pouvez affiner le potentiel de danger,
        tenir compte de la taille du groupe et des mesures de précaution envisagées.
      </p>

      <h3 class="title is-3">Potentiel de danger</h3>
      <ul class="potential-danger-labels has-text-black">
        <li
          v-for="label of potentialDangerLabels"
          :key="label.text"
          :disabled="!bra.high || (label.text < potentialDangerOptions.min || label.text > potentialDangerOptions.max)"
          :selected="method.potentialDanger == label.text"
          class="potential-danger-label is-size-5"
          @click="onChange(label.text, 'potentialDanger')"
        >
          <span :class="{ 'is-size-3 has-text-weight-bold': label.val }">
            {{ label.text }}
          </span>
        </li>
      </ul>

      <p v-if="method.potentialDanger" class="yetiform-info">
        Potentiel de danger: {{ method.potentialDanger }} (BRA: {{ bra.high }})
      </p>
      <p v-else class="yetiform-info">Pas de potentiel de danger sélectionné. Entrez d’abord le BRA</p>

      <div class="yetiform-note">
        <p>
          Le potentiel de danger est calculé à partir du niveau de danger du BRA. Il peut être affiné en sélectionnant
          un potentiel dans la plage correspondant au niveau du BRA. Par exemple: Le BRA évoque un danger 3 juste après
          une période en danger 4. On pourra alors indiquer un potentiel de danger de 12 au lieu de 8.
        </p>
      </div>

      <p>
        <input-checkbox :value="method.wetSnow" @input="onChange($event, 'wetSnow')">
          Neige mouillée : pas de prise en compte de l’orientation
        </input-checkbox>
      </p>

      <div class="yetiform-note">
        <p>
          Attention, par neige mouillée, aucun facteur de réduction d’orientation ou de fréquentation ne peut être
          appliqué.
        </p>
      </div>

      <h3 class="title is-3">Groupe</h3>

      <ul>
        <li class="control" v-for="(item, i) of groupSizes" :key="i">
          <input
            :id="'c2c-group-size-' + i"
            type="radio"
            name="groupSize"
            class="is-checkradio is-primary"
            :value="item.value"
            @change="onChange($event, 'groupSize')"
          />
          <label :for="'c2c-group-size-' + i">{{ item.text }}</label>
        </li>
      </ul>

      <div class="yetiform-note">
        <p>Taille du groupe</p>
        <ul class="content-ul">
          <li>Grand groupe = 5 personnes et plus</li>
          <li>Petit groupe = 2 à 4 personnes</li>
        </ul>
        <p>Distances de délestage</p>
        <ul class="content-ul">
          <li>10 mètres au minimum à la montée</li>
          <li>50 mètres à la descente</li>
        </ul>
      </div>

      <p>
        Le facteur <em>« pente parcourue fréquemment »</em> n’est pas pris en compte par l’application, car il est
        souvent difficile de s'en assurer lors de la préparation de course.
      </p>
    </div>
  </div>
</template>

<script>
import subPanelTitle from '@/components/yeti/SubPanelTitle.vue';

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
  components: { subPanelTitle },
  props: {
    method: {
      type: Object,
      default: null,
    },
    bra: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      methods: {
        mrd: ['MRD', 'Débutant'],
        mre: ['MRE', 'Élémentaire'],
        mrp: ['MRP', 'Expert'],
      },
      groupSizes: [
        {
          value: 1,
          text: 'Aucun facteur de réduction lié au groupe',
        },
        {
          value: 2.1,
          text: 'Grand groupe avec distance de délestage',
        },
        {
          value: 2.2,
          text: 'Petit groupe sans distance',
        },
        {
          value: 3,
          text: 'Petit groupe avec distance de délestage',
        },
      ],
    };
  },
  computed: {
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
      this.$emit('update:method', Object.assign(this.method, { [prop]: value }));
    },
    warnAboutMethodBra(item) {
      this.$emit('warnAboutMethodBra', item);
    },
    onBraChange() {
      this.onChange(this.potentialDangerOptions.val, 'potentialDanger');
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

p:not(:last-child),
ul:not(:last-child),
table:not(:last-child) {
  margin-bottom: 1rem;
}

.yetiform-danger {
  width: 100%;
  table-layout: fixed;
  color: $dark;
  background-color: $white-ter;

  tr {
    border: 1px solid $white;
    border-left: 0;
    border-right: 0;
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
      top: 1em !important;
      left: 1em !important;
    }
  }

  .is-checkradio:checked + label:after {
    top: 0.25rem !important;
    left: 0.25rem !important;
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
  .yetiform-danger tr,
  .yetiform-danger td {
    display: block;
  }
  .yetiform-danger tr {
    padding: 0.5em 0;
  }
  .yetiform-danger td:first-child {
    float: left;
  }
  .yetiform-danger td:first-child ~ td {
    height: auto;
    width: calc(100% - 60px);
    margin-left: 60px;
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
  }

  .potential-danger-label[disabled] {
    cursor: not-allowed;
    pointer-events: none;
    background-color: rgba(255, 255, 255, 0.8);
    color: grey;
  }

  .potential-danger-label[selected] {
    border-color: black;
  }
}
</style>
