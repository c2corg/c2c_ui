<template>
    <span class=""><i :class="iconClass"/></span>
</template>

<script>
    export default {
        props:{
            iconClass: {
                type: String,
                required: true,
            },
        }
    }
</script>
