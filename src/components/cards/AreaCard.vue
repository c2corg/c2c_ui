<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <span>
                {{ document.area_type }}
            </span>
        </div>
    </card-container>
</template>

<script>

    import cardMixins from './utils/mixins.js'

    export default {
        mixins: [
            cardMixins,
        ],
    }
</script>
