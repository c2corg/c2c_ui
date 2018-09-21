<template>
    <icon-quality v-tooltip="'Quality : ' + quality" :quality="quality"/>
</template>

<script>
    export default {
        props : {
            quality:{
                type:String,
                required:true,
            }
        }
    }
</script>
