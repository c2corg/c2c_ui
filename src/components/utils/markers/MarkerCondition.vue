<template>
    <icon-condition v-tooltip="$gettext(condition)" :condition="condition"/>
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
