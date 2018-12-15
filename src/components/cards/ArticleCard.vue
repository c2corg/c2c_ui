<template>
    <card-container :document="notClickable ? null : document">
        <card-title>
            <document-title :document="document"/>
        </card-title>

        <card-row>
            <textual-array :array="document.categories"/>
        </card-row>

        <card-row>
            <span>
                <icon-creative-commons />
                <span>{{ $gettext(document.article_type) }}</span>
            </span>
        </card-row>

        <card-row>
            <card-activities-item :activities="document.activities"/>
            <marker-quality :quality="document.quality" />
        </card-row>

    </card-container>
</template>

<script>

    import { documentCardMixin } from './utils/mixins.js'

    export default {
        mixins: [
            documentCardMixin
        ]
    }
</script>
