<template>
    <content-box v-if="document.associations && document.associations.waypoints.length"> <!-- version view does not have associtations...-->
        <strong>Waypoints</strong>
        <div v-for="waypoint of document.associations.waypoints" :key="waypoint.document_id" class="is-ellipsed">
            <document-link :document="waypoint">
                <document-title :document="waypoint"/><span>,</span>
                {{ waypoint.elevation }}&nbsp;m
            </document-link>
        </div>
    </content-box>
</template>

<script>
    import { props } from '@/js/properties.js'

    export default {
        props : props.requiredDocument,
    }
</script>
