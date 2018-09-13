<template>
    <div class="columns">
        <div class="column is-3">
            <content-box>
                <activities :activities="document.activities"/>
            </content-box>
            <license-box :cc="document.article_type=='collab' ? 'by-sa' : 'by-nc-nd'"/>
        </div>
        <div class="column is-9">
            <content-box>
                <summary>
                    <markdown :content="locale.summary"/>
                </summary>

                <markdown :content="locale.description"/>

            </content-box>

            <comments-box :document="document" :locale="locale" />
        </div>
    </div>
</template>

<script>
    import Markdown from './utils/Markdown'
    import LicenseBox from './utils/LicenseBox'
    import CommentsBox from './utils/CommentsBox'

    export default {

        components: {
            Markdown,
            CommentsBox,
            LicenseBox,
        },

        props : {
            document:Object,
            locale:Object,
            fields:Object,
        }
    }
</script>
