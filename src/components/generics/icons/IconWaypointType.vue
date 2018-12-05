<template>
    <fa-icon :icon="['waypoint', waypointType]"/>
</template>

<script lang="ts">
    export default {
        props: {
            waypointType: {
                type: String,
                required: true
            }
        }
    }
</script>
