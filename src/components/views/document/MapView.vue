<template>
    <view-container>
        <template slot-scope="{ document, fields }">
            <div>
                <div class="columns">
                    <div class="column is-3">
                        <label>editor</label>
                        <span>{{ document.editor }}</span>
                    </div>
                    <div class="column is-3">
                        <label>code</label>
                        <span>{{ document.code }}</span>
                    </div>
                    <div class="column is-3">
                        <label>Scale</label>
                        <span>{{ document.scale }}</span>
                    </div>
                </div>

                <markdown-section
                    :document="document"
                   
                    :field="fields.summary"/>

                <markdown-section
                    :document="document"
                   
                    :field="fields.description"
                    hide-title/>

                <comments-box :document="document" />

                <license-box cc="by-sa"/>

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
