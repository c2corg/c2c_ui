<template>
    <fa-icon
        :class="'icon-condition-' + condition"
        :icon="[condition !== null ? 'fas' : 'far', 'circle']" />
</template>

<script lang="ts">
    export default {
        props: {
            condition: {
                type: String,
                required: false,
                default: null
            }
        }
    }
</script>

<style scoped>

    .icon-condition-excellent{
        color:green;
    }

    .icon-condition-good{
        color:#9ACD32;
    }

    .icon-condition-average{
        color:yellow;
    }

    .icon-condition-poor{
        color:red;
    }

    .icon-condition-awful{
        color:#8B0000;
    }

    .icon-condition-null{
        color:lightgrey;
    }

</style>
