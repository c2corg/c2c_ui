<template>
    <span :title="$gettext('quality') + ' : ' + $gettext(quality)">
        <icon-quality :quality="quality"/>
    </span>
</template>

<script>
    export default {
        props: {
            quality: {
                type: String,
                required: true
            }
        }
    }
</script>
