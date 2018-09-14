<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <span>
                {{ document.area_type }}
            </span>
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
