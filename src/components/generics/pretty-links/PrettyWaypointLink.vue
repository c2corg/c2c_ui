<template>

    <document-link :document="waypoint" class="pretty-waypoint-link has-hover-background">
        <span :title="$gettext(waypoint.waypoint_type, 'waypoint_types')">
            <icon-waypoint-type :waypoint-type="waypoint.waypoint_type" class="has-text-dark"/>
        </span>
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

<style scoped lang="scss">

    .pretty-waypoint-link{
        display:block
    }

</style>
