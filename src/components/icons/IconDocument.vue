<template>
    <base-icon :iconClass="iconClass[type]" />
</template>

<script>
    var iconClass = {
        route:"fas fa-route",
        article:"fas fa-newspaper",
        xreport:"fas fa-flag-checkered",
        outing:"fas fa-edit",
        area:"fas fa-globe-americas",
        waypoint:"fas fa-map-pin",
        image:"fas fa-image",
        book:"fas fa-atlas",
    }

    export default {
        props:["type"],
        data(){
            return {
                iconClass
            }
        }
    }
</script>
