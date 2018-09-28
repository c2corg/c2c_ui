<template>
    <icon-quality v-tooltip="$gettext('quality') + ' : ' + $gettext(quality)" :quality="quality"/>
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
