<template>
    <card-container :document="notClickable ? null : document">
        <card-title>
            <document-title :document="document"/>
        </card-title>

        <card-row>
            <card-region-item :document="document" />
            <span class="is-nowrap">
                <icon-forum />
                @{{ document.forum_username }}
            </span>
        </card-row>

        <card-row>
            <card-activities-item
                v-if="document.activities"
                :activities="document.activities"/>
            &nbsp;

            <textual-array
                v-if="document.categories"
                :array="document.categories"
                class="is-ellipsed"/>
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
