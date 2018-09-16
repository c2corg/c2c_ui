<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <span v-for="book_type of document.book_types" :key="book_type">
                {{ book_type }}
            </span>
        </div>

        <div slot="row2" class="level">
            <span>
                <fa-icon icon="pen"/>
                {{ document.author }}
            </span>
        </div>

        <div slot="row3" class="level">
            <activities :activities="document.activities"/>
            <marker-quality :quality="document.quality"/>
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
