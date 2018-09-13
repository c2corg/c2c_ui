<template>
    <i :class="'icon-activity-' + activity"/>
</template>

<script>

    export default {
        props: {
            activity: String
        },
    }
</script>

<style scoped>


[class^="icon-activity-"], [class*=" icon-activity-"] {
  /* use !important to prevent issues with browser extensions that change fonts */
  font-family: 'c2c-activities' !important;
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

.icon-activity-slacklining:before {
  content: "\e907";
}
.icon-activity-mountain_climbing:before {
  content: "\e913";
}
.icon-activity-hiking:before {
  content: "\1f304";
}
.icon-activity-ice_climbing:before {
  content: "\1f31b";
}
.icon-activity-paragliding:before {
  content: "\1f332";
}
.icon-activity-rock_climbing:before {
  content: "\1f36a";
}
.icon-activity-skitouring:before {
  content: "\1f37d";
}
.icon-activity-snowshoeing:before {
  content: "\1f388";
}
.icon-activity-snow_ice_mixed:before {
  content: "\1f3fb";
}
.icon-activity-mountain_biking:before {
  content: "\1f433";
}
.icon-activity-via_ferrata:before {
  content: "\1f468";
}

</style>
