<template>
    <icon-quality :quality="quality" v-tooltip="'Quality : ' + quality"/>
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
