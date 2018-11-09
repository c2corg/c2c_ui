<template>
    <span>
        <icon-activity
            v-for="activity of activities"
            :key="activity"
            v-tooltip="tooltips ? $gettext(activity) : null"
            :activity="activity"/>
    </span>
</template>

<script>

    export default {
        props: {
            activities: {
                type: Array,
                required: true,
            },
            tooltips: { // default is false, because tooltip must not be activated on floating elements
                type: Boolean,
                default: false,
            }
        }
    }
</script>
