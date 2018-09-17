<template>
    <section v-show="isActive">
        <slot/>
    </section>
</template>

<script>
    export default {
        props : {
            title:String,
        },
        
        data(){
            return {
                isActive:false,
            }
        }
    }
</script>
