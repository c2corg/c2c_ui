<template>
    <i :class="'icon-quality-' + quality"/>
</template>

<script>
    export default {
        props: ['quality'],
    }
</script>

<style scoped>


[class^="icon-quality-"], [class*=" icon-quality-"] {
  /* use !important to prevent issues with browser extensions that change fonts */
  font-family: 'c2c-quality' !important;
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;

  /* Better Font Rendering =========== */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.icon-quality-bomb:before {
  content: "\e905";
}
.icon-quality-empty:before {
  content: "\e900";
}
.icon-quality-draft:before {
  content: "\e901";
}
.icon-quality-medium:before {
  content: "\e902";
}
.icon-quality-fine:before {
  content: "\e903";
}
.icon-quality-great:before {
  content: "\e904";
}


</style>
