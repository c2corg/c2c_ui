<template>
  <span :title="$gettext('quality') + ' : ' + $gettext(quality, 'quality_types')">
    <icon-quality :quality="quality" />
  </span>
</template>

<script>
  export default {
    props: {
      quality: {
        type: String,
        required: true
      }
    }
  };
</script>
