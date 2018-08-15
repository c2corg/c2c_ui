<template>
    <base-icon :iconClass="getIconClass(type)" />
</template>

<script>
    import constants from '@/js/constants.js'

    var iconClass = {
        route:"fas fa-route",
        profile:"fas fa-user",
        article:"fas fa-newspaper",
        xreport:"fas fa-flag-checkered",
        outing:"far fa-sun",
        area:"fas fa-globe-americas",
        waypoint:"fas fa-map-pin",
        image:"fas fa-image",
        book:"fas fa-atlas",
    }

    export default {
        props:["type"],
        methods:{
            getIconClass(type){
                return iconClass[constants.getDocumentType(type)]
            }
        }
    }
</script>
