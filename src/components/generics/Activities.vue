<template>
    <span>
        <span v-for="activity of activities" :key="activity" :title="$gettext(activity)">
            <icon-activity :activity="activity"/>
        </span>
    </span>
</template>

<script>
    export default {
        props: {
            activities: {
                type: Array,
                required: true
            }
        }
    }
</script>
