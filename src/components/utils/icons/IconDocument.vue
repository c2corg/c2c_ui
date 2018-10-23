<template>
    <span>
        <fa-icon :icon="iconClass" />
    </span>
</template>

<script>
    import { requireDocumentTypeProperty } from '@/js/propertiesMixins.js'

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
        mixins : [ requireDocumentTypeProperty ],

        computed:{
            iconClass(){
                return iconClass[this.documentType]
            }
        }
    }
</script>
