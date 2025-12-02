<template>
  <div class="centered loading-wrapper">
    <div class="loading-box">
      <div class="spinner"></div>
      <p class="loading-text">{{ $gettext('Loading...') }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ItinevertLoadingView',
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
</style>
