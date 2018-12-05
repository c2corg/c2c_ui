<template>

    <document-link :document="waypoint">
        <icon-waypoint-type :waypoint-type="waypoint.waypoint_type" class="has-text-dark"/>
        <document-title :document="waypoint"/><span class="has-text-dark">, {{ waypoint.elevation }}&nbsp;m</span>
    </document-link>

</template>

<script>
    export default {
        props: {
            waypoint: {
                type: Object,
                required: true
            }
        }
    }
</script>
