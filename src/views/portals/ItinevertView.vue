<template>
  <div class="section">
    <html-header :title="$gettext('Itinevert')" />
    <!-- Discover view description -->
    <div class="box intro" :class="{ 'itinevert-result-header': wizardView === 'result' }">
      <div class="feed-title has-cursor-pointer">
        <span class="title is-4 itinevert-title" :class="{ 'is-marginless': !visible }" v-translate>Itinevert</span>
        <div class="title is-4" v-if="canStartAgain">
          <button
            class="start-again-button button tooltip-container"
            data-tooltip="left"
            @click="() => changeView('form')"
          >
            <fa-icon class="back-icon" icon="arrow-left" aria-hidden="true"></fa-icon>
            <span v-translate>Start a search again</span>
            <span class="tooltip" v-translate>The current criteria will be retained</span>
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
    <div class="box wizard">
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
      return this.wizardView === 'result' || this.wizardView === 'filter';
    },
  },
  mounted() {
    const stored = this.$localStorage.get('itinevert_visible');
    if (stored !== null) {
      this.visible = stored;
    }
    // Listen for back/forward navigation
    window.addEventListener('popstate', (event) => {
      // whenever user press back button in itinevert, we go back to form view
      this.changeView('form');
    });
  },
  methods: {
    changeView(view) {
      this.wizardView = view;
      // allow the user to press back button to go back to form view when
      // he went from form to filter view
      // he went from form to result view
      if (view === 'filter' || (this.wizardView === 'form' && view === 'result')) {
        history.pushState(null, 'Itinevert', window.location.href);
      }
    },
    toggleProperty(property) {
      this.setProperty(property, !this[property]);
    },
    setProperty(property, value) {
      this[property] = value;
      this.$localStorage.set(`itinevert_${property}`, this[property]);
    },
  },
};
</script>

<style scoped lang="scss">
@media screen and (max-width: $tablet) {
  .feed-title {
    padding-left: 0;
    padding-right: 0;
  }

  .section {
    display: flex;
    flex-direction: column;
  }

  .itinevert-result-header {
    height: $itinevert-header-height;
    position: fixed;
    top: 3.25rem;
    left: 0;
    background: white;
    z-index: 24;
  }

  .wizard {
    flex-grow: 1;
  }

  .field {
    flex-direction: column;
  }

  .title {
    width: 100%;
  }

  .start-again-button {
    width: 100%;
    margin-top: 16px;
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

.tooltip-container {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

/* base tooltip */
.tooltip {
  position: absolute;
  opacity: 0;
  transition: 0.2s;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
}

/* show on hover */
.tooltip-container:hover .tooltip {
  opacity: 1;
}

/* LEFT position */
[data-tooltip='left'] .tooltip {
  top: 50%;
  right: calc(100% + 8px);
  transform: translateY(-50%);
}

[data-tooltip='left'] .tooltip::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 100%;
  transform: translateY(-50%);
  border-left: 6px solid rgba(0, 0, 0, 0.8);
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
}

.back-icon {
  padding-right: 1rem;
}
</style>
