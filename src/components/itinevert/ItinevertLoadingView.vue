<template>
  <div class="centered loading-wrapper">
    <div class="loading-box">
      <div class="spinner" v-show="isSpinner"></div>
      <div class="progress" v-show="!isSpinner">
        <div
          class="progress__track"
          role="progressbar"
          :aria-valuenow="progress"
          :aria-valuemin="0"
          :aria-valuemax="total"
        >
          <div class="progress__bar" :style="{ width: computedPercent + '%' }"></div>
        </div>
      </div>
      <div class="progress__label" v-show="total !== 0">{{ computedPercent + '%' }}</div>

      <p class="loading-text">{{ $gettext('Loading...') }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ItinevertLoadingView',
  props: {
    progress: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    isSpinner: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    computedPercent() {
      const t = Number(this.total) || 0;
      if (t === 0) return 0;
      return Math.min(100, Math.round((Number(this.progress) / t) * 100));
    },
  },
};
</script>

<style scoped lang="scss">
/* fills the entire parent container */
.loading-wrapper {
  align-items: center;
  box-sizing: border-box;
}

/* centered box */
.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  background: #fff;
  padding: 24px 30px;
  min-width: 220px;
}

/* larger spinner with smooth animation */
.spinner {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 6px solid rgba(0, 0, 0, 0.1);
  border-top-color: #ff9933;
  animation: spin 0.8s linear infinite;
  box-sizing: border-box;
}

.loading-text {
  margin: 0;
  color: #4a4a4a;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.progress {
  height: 100%;
  width: 320px;
  display: inline-block;
  font-family: system-ui, sans-serif;
}

/* track */
.progress__track {
  width: 100%;
  height: 20px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 3px;
  box-sizing: border-box;
  overflow: hidden;
}

/* fill */
.progress__bar {
  height: 100%;
  border-radius: 10px;
  background: linear-gradient(90deg, #ffb366, #ff9933);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.12);
  transition: width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: width;
}

/* label below the bar */
.progress__label {
  color: #333;
  text-align: center;
  user-select: none;
}
</style>
