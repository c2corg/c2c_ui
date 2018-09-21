<template>
    <icon-condition v-tooltip="condition" :condition="condition"/>
</template>

<script>
    export default {
        props : {
            condition:{
                type:String,
                default:null,
            }
        }
    }
</script>
