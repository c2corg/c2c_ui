<template>
  <div class="box public-transports-box">
    <h2 class="title is-2">
      <span>{{ $gettext('Access by public transport') }}</span>
    </h2>
    <button class="button is-primary public-transports-button">
      <img class="public-transports-bus" src="@/assets/img/boxes/public_transports.png" />
      {{ $gettext('Show nearby stops') }}
    </button>
    <div class="public-transports-section">
      <div class="public-transports-result"></div>
      <div class="public-transports-map">
        <map-view
          ref="mapView"
          :documents="new Array(document)"
          :show-protection-areas="['r', 'w'].includes(document.type)"
          :biodiv-sports-activities="document.activities"
          :full-screen-element-id="
            !$screen.isMobile && showElevationProfile && elevationProfileHasData ? 'fullscreen-map-container' : null
          "
          :show-pin-to-top-button="true"
          @has-protection-area="$emit('has-protection-area')"
          @pin-to-top-clicked="togglePinToSide(true)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],
  props: {
    document: Object,
  },
  mounted() {
    console.log('Document reçu dans transports-box :', this.document);
  },
};
</script>

<style scoped lang="scss">
.public-transports-box {
  .public-transports-button {
    display: flex;

    .public-transports-bus {
      width: 18px;
      height: 18px;
      margin-right: 8px;
    }
  }
  .public-transports-section {
    margin-top: 20px;
    display: flex;
    gap: 20px;

    .public-transports-result {
      width: 100%;
      height: 400px;
      border: 1px solid lightgray;
      border-radius: 4px;
    }
    .public-transports-map {
      width: 100%;
      height: 400px;
      border: 1px solid lightgray;
      border-radius: 4px;
    }
  }
}
</style>
