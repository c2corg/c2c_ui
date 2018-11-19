<template>
    <!-- it's not a simple icon (tooltip), so do not move it in icons folder -->
    <span v-if="imageCount && imageCount>0" v-tooltip="imageCount + ' ' + $gettext(' images')">
        <icon-image />
    </span>
</template>

<script>
    export default {
        props : {
            imageCount:{
                type: Number,
                default: null,
            }
        }
    }
</script>
