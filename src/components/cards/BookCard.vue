<template>
    <card-container :document="notClickable ? null : document">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <textual-array :array="document.book_types"/>
        </div>

        <div slot="row2" class="level">
            <span>
                <fa-icon icon="pen"/>
                {{ document.author }}
            </span>
        </div>

        <div slot="row3" class="level">
            <card-activities-item :activities="document.activities"/>
            <marker-quality :quality="document.quality"/>
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
