<template>
    <!-- it's not a simple icon (tooltip), so do not mive it in icons folder -->
    <span v-tooltip="imageCount + $gettext(' images')">
        <icon-image />
    </span>
</template>

<script>
    export default {
        props : {
            imageCount:{
                type: Number,
                required: true,
            }
        }
    }
</script>
