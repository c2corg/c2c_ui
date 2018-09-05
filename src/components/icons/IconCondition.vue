<template>
    <span class="icon">
        <span v-if="condition" :class="'icon-condition-'+condition">
            <i class="fas fa-circle"></i>
        </span>
        <span v-else>
            <i class="far fa-circle"></i>
        </span>
    </span>
</template>

<script>
    export default {
        props: ['condition'],
    }
</script>
