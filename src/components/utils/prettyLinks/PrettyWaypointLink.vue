<template>

    <document-link :document="waypoint">
        <icon-waypoint-type :waypoint-type="waypoint.waypoint_type"/>
        <document-title :document="waypoint"/><span>,</span>
        {{ waypoint.elevation }}&nbsp;m
    </document-link>

</template>

<script>
    export default {
        props : {
            waypoint:{
                type:Object,
                required:true,
            }
        }
    }
</script>
