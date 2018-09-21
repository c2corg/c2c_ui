<template>
    <section v-show="isActive">
        <slot/>
    </section>
</template>

<script>
    export default {
        props : {
            title:{
                type:String,
                required:true,
            }
        },

        data(){
            return {
                isActive:false,
            }
        }
    }
</script>
