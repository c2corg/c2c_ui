<template>
    <card-container :to="{name:documentType, params:{id:document.document_id}}">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <card-region-item :document="document" />
            <span class="is-nowrap">
                <icon-forum />
                @{{ document.forum_username }}
            </span>
        </div>

        <div slot="row2" class="level">
            <card-activities-item
                v-if="document.activities"
                :activities="document.activities"/>
            &nbsp;

            <textual-array
                v-if="document.categories"
                :array="document.categories"
                class="is-ellipsed"/>
        </div>
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
