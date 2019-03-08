<template>
  <fa-layers>
    <fa-icon class="sun" icon="sun" transform="shrink-4 up-2 left-2" spin />
    <fa-icon icon="cloud" :style="{ color: 'white' }" transform="shrink-3 flip-h left-1 down-3" />
    <fa-icon icon="cloud" transform="shrink-5 flip-h left-1 down-3" />
  </fa-layers>
</template>

<style scoped>
.sun{
    animation: fa-spin 30s infinite linear;
}
</style>
