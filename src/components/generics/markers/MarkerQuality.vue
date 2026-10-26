<template>
  <span :title="$gettext('quality') + ' : ' + $gettext(quality, 'quality_types')">
    <icon-quality :quality="quality" />
  </span>
</template>

<script setup lang="ts">
defineProps({
  quality: {
    type: String,
    required: true,
  },
});
</script>
