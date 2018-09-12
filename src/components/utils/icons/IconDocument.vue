<template>
    <fa-icon :icon="getIconClass(type)" />
</template>

<script>
    import constants from '@/js/constants.js'

    var iconClass = {
        route:"route",
        profile:"user",
        article:"newspaper",
        xreport:"flag-checkered",
        outing:["far", "sun"],
        area:"globe-americas",
        waypoint:"map-pin",
        image:"image",
        book:"atlas",
        map:"map",
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
