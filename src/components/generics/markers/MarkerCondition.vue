<template>
    <span :title="$gettext(condition)">
        <icon-condition :condition="condition"/>
    </span>
</template>

<script lang="ts">
    export default {
        props: {
            condition: {
                type: String,
                default: null
            }
        }
    }
</script>
