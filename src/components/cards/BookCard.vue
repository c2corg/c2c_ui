<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <span v-for="book_type of document.book_types" :key="book_type">
                {{book_type}}
            </span>
        </div>

        <div slot="row2">
            <fa-icon icon="pen"/>
            {{document.author}}
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
