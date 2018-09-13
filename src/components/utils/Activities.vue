<template>
    <span>
        <icon-activity v-for="activity of activities" :key="activity"
                       :activity="activity"/>
    </span>
</template>

<script>

    export default {
        props: {
            activities: Array
        }
    }
</script>
