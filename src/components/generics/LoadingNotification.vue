<template>
    <div>
        <div v-if="!promise.data && !promise.error" class="notification is-primary">
            Loading
        </div>
        <div v-else-if="promise.error" class="notification is-danger">
            {{ promise.error.message }}
        </div>
    </div>
</template>

<script>

    export default {
        props: {
            promise:{
                type:Object,
                required:true,
            },
        }
    }
</script>
