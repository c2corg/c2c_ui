<template>
    <span>
        <icon-activity
            v-for="activity of activities"
            :key="activity"
            v-tooltip="activity"
            :activity="activity"/>
    </span>
</template>

<script>

    export default {
        props: {
            activities: {
                type:Array,
                required:true,
            }
        }
    }
</script>
