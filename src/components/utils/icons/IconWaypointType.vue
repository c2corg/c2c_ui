<template>
    <span>
        <i :class="'icon-waypoint-' + waypointType"/>
    </span>
</template>

<script>
    export default {
        props: {
            waypointType: {
                type:String,
                required:true,
            }
        },
    }
</script>

<style scoped>



[class^="icon-waypoint-"], [class*=" icon-waypoint-"] {
  /* use !important to prevent issues with browser extensions that change fonts */
  font-family: 'c2c-waypoint' !important;
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

.icon-waypoint-access:before {
  content: "\e900";
}
.icon-waypoint-base_camp:before {
  content: "\e901";
}
.icon-waypoint-bergschrund:before {
  content: "\e902";
}
.icon-waypoint-bisse:before {
  content: "\e903";
}
.icon-waypoint-bivouac:before {
  content: "\e904";
}
.icon-waypoint-camp_site:before {
  content: "\e905";
}
.icon-waypoint-canyon:before {
  content: "\e906";
}
.icon-waypoint-cliff:before {
  content: "\e908";
}
.icon-waypoint-climbing_indoor:before {
  content: "\e909";
}
.icon-waypoint-climbing_outdoor:before {
  content: "\e90a";
}
.icon-waypoint-confluence:before {
  content: "\e90b";
}
.icon-waypoint-gite:before {
  content: "\e90c";
}
.icon-waypoint-glacier:before {
  content: "\e90d";
}
.icon-waypoint-hut:before {
  content: "\e90e";
}
.icon-waypoint-lake:before {
  content: "\e90f";
}
.icon-waypoint-locality:before {
  content: "\e910";
}
.icon-waypoint-local_product:before {
  content: "\e911";
}
.icon-waypoint-misc:before {
  content: "\e912";
}
.icon-waypoint-paragliding_takeoff:before {
  content: "\e914";
}
.icon-waypoint-pass:before {
  content: "\e915";
}
.icon-waypoint-pit:before {
  content: "\e916";
}
.icon-waypoint-shelter:before {
  content: "\e917";
}
.icon-waypoint-slackline_spot:before {
  content: "\e918";
}
.icon-waypoint-summit:before {
  content: "\e919";
}
.icon-waypoint-virtual:before {
  content: "\e91a";
}
.icon-waypoint-waterfall:before {
  content: "\e91b";
}
.icon-waypoint-waterpoint:before {
  content: "\e91c";
}
.icon-waypoint-waypoints:before {
  content: "\e91d";
}
.icon-waypoint-weather_station:before {
  content: "\e91e";
}
.icon-waypoint-webcam:before {
  content: "\e91f";
}
.icon-waypoint-paragliding_landing:before {
  content: "\e920";
}
.icon-waypoint-cave:before {
  content: "\e921";
}


</style>
