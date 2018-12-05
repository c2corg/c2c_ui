<template>
    <fa-icon
        v-if="name"
        icon="info-circle"
        class="marker-helper has-text-info"
        @click="$helper.show(name)" />
</template>

<script lang="ts">
    export default {
        props: {
            name: {
                type: String,
                default: null
            }
        }
    }
</script>

<style scoped>
    .marker-helper{
        cursor:pointer
    }
</style>
