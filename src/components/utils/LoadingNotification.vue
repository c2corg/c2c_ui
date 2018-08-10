<template>
    <div>
        <div class="notification is-primary" v-if="!loaded && error==null">
            Loading
        </div>
        <div class="notification is-danger" v-if="error!=null">
            {{error}}
        </div>
    </div>
</template>

<script>

    export default {
        props: ['loaded', 'error'],
    }
</script>