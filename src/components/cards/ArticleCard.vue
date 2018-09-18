<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <span v-for="category of document.categories" :key="category">
                {{ category }}
            </span>
        </div>

        <div slot="row2" class="level">
            <icon-creative-commons />{{ document.article_type }}
        </div>

        <div slot="row3" class="level">
            <card-activities-item :activities="document.activities"/>
            <marker-quality :quality="document.quality" />
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
