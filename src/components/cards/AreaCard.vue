<template>
    <card-container :document="notClickable ? null : document" :highlighted="highlighted">
        <card-title>
            <document-title :document="document"/>
        </card-title>

        <card-row>
            <span>
                {{ document.area_type }}
            </span>
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
