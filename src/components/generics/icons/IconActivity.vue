<template>
    <fa-icon :icon="['activity', activity]" />
</template>

<script lang="ts">

    export default {
        props: {
            activity: {
                type: String,
                required: true
            }
        }
    }
</script>
