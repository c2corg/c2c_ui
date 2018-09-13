<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <p slot="row1" class="level">
            <span>{{ document.area_type }}</span>
        </p>
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
