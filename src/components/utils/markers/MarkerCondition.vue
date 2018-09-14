<template>
    <icon-condition :condition="condition" v-tooltip="condition"/>
</template>

<script>
    export default {
        props : {
            condition:{
                type:String,
                required:true,
            }
        }
    }
</script>
