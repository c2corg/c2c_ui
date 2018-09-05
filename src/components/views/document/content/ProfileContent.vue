<template>
    <div v-if="!document.not_authorized">

        <div class="columns">
            <div class="column is-9">
                <summary>
                    <markdown :content="locale.summary"></markdown>
                </summary>

                <markdown :content="locale.description"></markdown>

            </div>
            <div class="column is-3">
                <activities :activities="document.activities"/>

                <label-value label="forum">
                    @{{document.forum_username}}
                </label-value>

                <field-view :document="document" :field="field.categories"/>

                <div>
                    <router-link :to="{ name: 'whatsnew', query: {u:$route.params.id} }">
                        contributions
                    </router-link>
                </div>

                <document-license :document="document" cc="by-nc-nd"/>

            </div>
        </div>
    </div>
    <div v-else>
        You're not authorized. Please sign-in or create an account
    </div>
</template>

<script>
    import Markdown from './utils/Markdown'
    import LabelValue from './utils/LabelValue'
    import FieldView from './utils/FieldView'

    export default {

        components: {
            Markdown,
            LabelValue,
            FieldView,
        },

        props:["document", "locale", "fields"],
    }
</script>
