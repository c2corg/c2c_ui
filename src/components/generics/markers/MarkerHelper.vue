<template>
    <fa-icon
        v-if="name"
        icon="info-circle"
        class="marker-helper has-text-info"
        :class="{'has-text-danger':isLegacyHelper}"
        @click="$helper.show(name)" />
</template>

<script>
    export default {
        props: {
            name: {
                type: String,
                default: null
            }
        },

        computed: {
            isLegacyHelper() {
                return !this.name.match(/^\d+(#[a-z0-9-]+)?$/)
            }
        }
    }
</script>

<style scoped>
    .marker-helper{
        cursor:pointer
    }
</style>
