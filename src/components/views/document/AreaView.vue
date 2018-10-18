<template>
    <view-container>
        <template slot-scope="{ document, fields }">
            <div class="columns">
                <div class="column is-3">
                    <map-box :document="document"/>
                    <license-box cc="by-sa"/>
                </div>

                <div class="column">
                    <content-box v-if="locale.summary || locale.description">
                        <markdown-section :document="document" :field="fields.summary"/>
                        <markdown-section :document="document" :field="fields.description"/>
                    </content-box>

                    <comments-box :document="document" />
                </div>
            </div>
        </template>
    </view-container>
</template>

<script>
    import viewComponentsMixin from "./utils/viewComponentsMixin.js"

    export default {
        mixins : [ viewComponentsMixin ],
    }
</script>
