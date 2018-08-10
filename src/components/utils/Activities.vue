<template>
    <span>
        <activity v-for="activity of activities"
                  :activity="activity"
                  :key="activity"/>
    </span>
</template>

<script>
    import Activity from '@/components/utils/Activity'

    export default {
        components: {
            Activity,
        },

        props: ['activities'],
    }
</script>
