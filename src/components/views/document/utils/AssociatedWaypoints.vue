<template>
    <content-box v-if="document.associations && document.associations.waypoints.length"> <!-- version view does not have associtations...-->
        <strong>Waypoints</strong>
        <div v-for="waypoint of document.associations.waypoints" :key="waypoint.document_id" class="is-ellipsed">
            <icon-waypoint-type :waypoint-type="waypoint.waypoint_type"/>
            <document-link :document="waypoint">
                <document-title :document="waypoint"/><span>,</span>
                {{ waypoint.elevation }}&nbsp;m
            </document-link>
        </div>
    </content-box>
</template>

<script>
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [ requireDocumentProperty ],
    }
</script>
