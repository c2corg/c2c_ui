<template>
    <section v-show="isActive">
        <slot></slot>
    </section>
</template>

<script>
    export default {
        props : ["title"],
        data(){
            return {
                isActive:false,
            }
        }
    }
</script>
