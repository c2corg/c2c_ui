<template>
    <div>
        <div v-if="!loaded && error==null" class="notification is-primary">
            Loading
        </div>
        <div v-if="error!=null" class="notification is-danger">
            {{ error }}
        </div>
    </div>
</template>

<script>

    export default {
        props: {
            loaded:Boolean,
            error: [String, Object],
        }
    }
</script>
