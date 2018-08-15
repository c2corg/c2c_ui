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
                <information-item label="forum">
                    @{{document.forum_username}}
                </information-item>
                <simple-information-item label="categories" :content="document.categories"/>
                <information-item>
                    <router-link :to="{ name: 'whatsnew', query: {u:$route.params.id} }">
                        contributions
                    </router-link>
                </information-item>
                <document-license :document="document" cc="by-nc-nd"/>

            </div>
        </div>
    </div>
    <div v-else>
        You're not authorized. Please sign-in or create an account
    </div>
</template>

<script>
    import Markdown from '@/components/views/document/utils/Markdown'
    import Activities from '@/components/utils/Activities'
    import DocumentLicense from '@/components/utils/DocumentLicense'
    import Gallery from '@/components/utils/Gallery'
    import InformationItem from '@/components/views/document/utils/InformationItem'
    import SimpleInformationItem from '@/components/views/document/utils/SimpleInformationItem'

    export default {

        components: {
            Markdown,
            Activities,
            DocumentLicense,
            Gallery,
            SimpleInformationItem,
            InformationItem
        },

        props:["document", "locale"]
    }
</script>
