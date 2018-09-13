<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <span v-for="category of document.categories" :key="category">
                {{category}}
            </span>
        </div>

        <div slot="row2">
            <icon-creative-commons />{{document.article_type}}
        </div>

        <div slot="row3">
            <activities :activities="document.activities"/>
            <icon-quality :quality="document.quality" class="is-pulled-right"/>
        </div>

    </card-container>
</template>

<script>
    import CardContainer from './utils/CardContainer'
    import constants from '@/js/constants.js'

    export default {
        components: {
            CardContainer,
        },

        props: {
            document: {
                type: Object,
                required: true,
            }
        },

        methods:{
            go(){
                this.$router.push({
                    name: constants.getDocumentType(this.document.type),
                    params: { id: this.document.document_id }
                })
            }
        },
    }
</script>
