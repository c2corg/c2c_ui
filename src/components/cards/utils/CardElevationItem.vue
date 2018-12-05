<template>
    <span v-if="elevation">
        <span v-tooltip="$gettext('elevation_max')">
            <fa-icon icon="sort-amount-up" class="has-text-primary"/>
        </span>
        {{ elevation }}&nbsp;m
    </span>
</template>

<script>

    export default {
        props: {
            elevation: {
                type: Number,
                default: null
            }
        }
    }

</script>
