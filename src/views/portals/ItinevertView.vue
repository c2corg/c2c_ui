<template>
  <div class="section">
    <html-header :title="$gettext('Itinevert')" />
    <!-- Discover view description -->
    <div class="box intro">
      <div class="feed-title has-cursor-pointer">
        <span class="title is-4 itinevert-title" :class="{ 'is-marginless': !visible }" v-translate>
          Change your approach: plan your public transport outing
        </span>
        <div class="title is-4" v-if="canStartAgain">
          <button
            class="start-again-button button"
            @click="() => changeView('form')"
            :data-tooltip="$gettext('The current criteria will be retained')"
          >
            <fa-icon class="back-icon" icon="arrow-left" aria-hidden="true" />
            <span v-translate>Start a search again</span>
          </button>
        </div>
        <fa-icon
          v-if="!canStartAgain"
          class="is-size-6 no-print accordion-icon mt-2"
          icon="angle-down"
          :rotation="visible ? 180 : undefined"
          @click="toggleProperty('visible')"
        />
      </div>
      <itinevert-banner v-show="visible && !canStartAgain" />
    </div>
    <div class="box">
      <itinevert-wizard :view="wizardView" @change-view="changeView"></itinevert-wizard>
    </div>
  </div>
</template>

<script>
import ItinevertBanner from '../../components/itinevert/ItinevertBanner.vue';
import ItinevertWizard from '../../components/itinevert/ItinevertWizard.vue';

export default {
  name: 'ItinevertView',

  components: {
    ItinevertBanner,
    ItinevertWizard,
  },

  data() {
    let state = true;

    if (this.$user.isLogged) {
      state = false;
    }

    return {
      visible: state,
      wizardView: 'form',
    };
  },
  computed: {
    canStartAgain() {
      return this.wizardView === 'result';
    },
  },
  methods: {
    changeView(view) {
      this.wizardView = view;
    },
    toggleProperty(property) {
      this.setProperty(property, !this[property]);
    },
    setProperty(property, value) {
      this[property] = value;
      this.$localStorage.set(`${property}`, this[property]);
    },
  },
};
</script>

<style scoped lang="scss">
@media screen and (max-width: $tablet) {
  .feed-view {
    padding-left: 0;
    padding-right: 0;

    .feed-title {
      padding-left: 0;
      padding-right: 0;
    }
  }

  .field {
    flex-direction: column;
  }

  .preference-switch {
    margin-top: 0.3rem;
    margin-left: 0.3rem;
    display: flex;
  }

  .preference-switch > span {
    display: flex;
    flex-direction: row-reverse;
  }

  .preference-switch > span > * {
    margin-right: 0.3rem;
  }
}

@media screen and (min-width: $tablet) {
  .feed-view {
    margin-top: $size-3;
  }

  .field {
    justify-content: space-between;
    align-items: baseline;
  }
}

.feed-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
  .itinevert-title {
    margin-bottom: 0px !important;
  }

  span:first-child {
    flex-grow: 1;
  }
}

.intro {
  margin-bottom: $size-6;
}

.switch[type='checkbox']:checked + label::before {
  background: $color-base-c2c;
}

.toggleCheckbox {
  display: none;
}

.toggleContainer {
  position: relative;
  border-radius: 20px;
  background: white;
  border: 1px solid $color-base-c2c;
  padding: 5px 2px;
  cursor: pointer;
}

.toggleContainer span {
  padding: 3px 10px;
  text-align: center;
  z-index: 100;
}

.field {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.ams-ad {
  margin-bottom: $size-7;
}

.start-again-button {
  font-weight: bold;
  border: 1px solid black;
}

[data-tooltip] {
  position: relative;

  &:hover::before {
    transform: translate(0);
    opacity: 1;
  }

  &::before {
    content: attr(data-tooltip);
    position: absolute;
    width: 250px;
    font-size: 12px;
    display: block;
    background: #fff;
    padding: 10px;
    top: -50px;
    box-shadow: 0px 2px 5px #0000008c;
    border-radius: 3px;
    text-align: center;
    left: 0;
    z-index: 1;
    opacity: 0;
    pointer-events: none;
    transform: translateY(20px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: normal;
    word-wrap: break-word;
    top: 150%;
    transform: translateY(-10px);
  }
}

.back-icon {
  padding-right: 1rem;
}
</style>
