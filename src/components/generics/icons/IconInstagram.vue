<template>
  <span>
    <!-- hack to be able to apply gradient on font awesome 5 icons: https://stackoverflow.com/questions/47800574/gradient-over-instagram-svg-of-fontawesome-5 -->
    <svg width="0" height="0">
      <radialGradient id="rg" r="150%" cx="30%" cy="107%">
        <stop stop-color="#fdf497" offset="0" />
        <stop stop-color="#fdf497" offset="0.05" />
        <stop stop-color="#fd5949" offset="0.45" />
        <stop stop-color="#d6249f" offset="0.6" />
        <stop stop-color="#285AEB" offset="0.9" />
      </radialGradient>
    </svg>
    <fa-icon :icon="['fab', 'instagram']" class="instagram-icon" />
  </span>
</template>

<style lang="scss" scoped>
.instagram-icon * {
  fill: url(#rg);
}
</style>
