<template>

    <div class="columns">


        <div class="column is-3">
            <content-box>
                <label-value label="activities">
                    <activities :activities="document.activities"/>
                </label-value>

                <field-view :document="document" :field="fields.author"/>

                <field-view :document="document" :field="fields.book_types"/>

                <field-view :document="document" :field="fields.editor"/>
                <field-view :document="document" :field="fields.isbn"/>
                <field-view :document="document" :field="fields.nb_pages"/>
                <field-view :document="document" :field="fields.publication_date"/>
                <field-view :document="document" :field="fields.url"/>
            </content-box>

            <license-box cc="by-sa"/>

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
    import LabelValue from './utils/LabelValue'
    import FieldView from './utils/FieldView'
    import LicenseBox from './utils/LicenseBox'


    import CommentsBox from './utils/CommentsBox'

    export default {

        components: {
            Markdown,
            LabelValue,
            FieldView,
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
