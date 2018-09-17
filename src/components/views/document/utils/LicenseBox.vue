<template>
    <content-box class="has-text-centered">
        <document-license :cc="cc"/>
    </content-box>
</template>

<script>
    export default {
        props:{
            cc: String,
        }
    }
</script>
