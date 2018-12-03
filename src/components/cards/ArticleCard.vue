<template>
    <card-container :to="{name:documentType, params:{id:document.document_id}}">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <textual-array :array="document.categories"/>
        </div>

        <div slot="row2" class="level">
            <span>
                <icon-creative-commons />
                <span>{{ $gettext(document.article_type) }}</span>
            </span>
        </div>

        <div slot="row3" class="level">
            <card-activities-item :activities="document.activities"/>
            <marker-quality :quality="document.quality" />
        </div>

    </card-container>
</template>

<script>

    import { documentCardMixin } from './utils/mixins.js'

    export default {
        mixins: [
            documentCardMixin,
        ],
    }
</script>
