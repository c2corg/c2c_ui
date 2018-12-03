<template>
    <card-container :to="{name:documentType, params:{id:document.document_id}}">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <span>
                {{ document.area_type }}
            </span>
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
