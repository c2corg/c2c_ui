<template>
    <view-container>
        <template slot-scope="{ document, fields }">
            <div class="columns">
                <div class="column is-3">
                    <content-box>
                        <activities :activities="document.activities"/>
                    </content-box>

                    <lang-switcher-box :document="document" />

                    <license-box :cc="document.article_type=='collab' ? 'by-sa' : 'by-nc-nd'"/>
                </div>
                <div class="column is-9">
                    <content-box>
                        <markdown-section :document="document" :field="fields.summary"/>
                        <markdown-section :document="document" :field="fields.description" hide-title/>
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
