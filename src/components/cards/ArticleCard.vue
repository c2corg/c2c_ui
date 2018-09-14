<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <span v-for="category of document.categories" :key="category">
                {{ category }}
            </span>
        </div>

        <div slot="row2" class="level">
            <icon-creative-commons />{{ document.article_type }}
        </div>

        <div slot="row3" class="level">
            <activities :activities="document.activities"/>
            <marker-quality :quality="document.quality" />
        </div>

    </card-container>
</template>

<script>
    import { props } from '@/js/properties.js'

    import CardContainer from './utils/CardContainer'
    import constants from '@/js/constants.js'

    export default {
        components: {
            CardContainer,
        },

        props: props.requiredDocument,

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
