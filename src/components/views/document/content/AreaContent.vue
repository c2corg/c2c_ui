<template>

    <div class="columns">
        <div class="column is-3">
            <map-box :document="document"></map-box>
            <license-box cc="by-sa"></license-box>
        </div>

        <div class="column">
            <content-box>
                <markdown-section :document="document" :locale="locale" :field="fields.summary"/>
                <markdown-section :document="document" :locale="locale" :field="fields.description"/>
            </content-box>

            <comments-box :document="document" :locale="locale" />
        </div>
    </div>
</template>

<script>
    import Markdown from './utils/Markdown'
    import MarkdownSection from './utils/MarkdownSection'
    import CommentsBox from './utils/CommentsBox'
    import LicenseBox from './utils/LicenseBox'
    import MapBox from './utils/MapBox'

    export default {

        components: {
            Markdown,
            MarkdownSection,
            CommentsBox,
            LicenseBox,
            MapBox,
        },

        props:["document", "locale", "fields"],
    }
</script>
