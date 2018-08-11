<template>
    <span>
        <icon-activity v-for="activity of activities"
                  :activity="activity"
                  :key="activity"/>
    </span>
</template>

<script>

    export default {
        props: ['activities'],
    }
</script>
