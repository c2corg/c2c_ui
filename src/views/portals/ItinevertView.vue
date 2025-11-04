<template>
  <div class="section">
    <html-header :title="$gettext('Itinevert')" />
    <!-- Discover view description -->
    <div class="box intro">
      <div class="feed-title has-cursor-pointer">
        <span class="title is-4" :class="{ 'is-marginless': !visible }" v-translate>
          Change your approach: plan your public transport outing
        </span>
        <fa-icon
          class="is-size-6 no-print accordion-icon mt-2"
          icon="angle-down"
          :rotation="visible ? 180 : undefined"
          @click="toggleProperty('visible')"
        />
      </div>
      <Itinevert-banner v-show="visible" :can-start-again="canStartAgain" @change-view="changeView" />
    </div>
    <div class="box">
      <Itinevert-wizard :view="wizardView" @change-view="changeView"></Itinevert-wizard>
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

.is-active {
  color: white;
  border-radius: 20px;
  background: $color-base-c2c;
  transition: color 0.3s;
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
</style>
