<template>
    <fa-icon
        v-if="name"
        icon="info-circle"
        class="marker-helper has-text-info"
        @click="$showHelper(name)" />
</template>

<script>
    export default {
        props:{
            name:{
                type:String,
                default:undefined,
            }
        }
    }
</script>

<style scoped>
    .marker-helper{
        cursor:pointer
    }
</style>
