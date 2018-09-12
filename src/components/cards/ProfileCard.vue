<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <span class="is-ellipsed">
                <card-region-item :document="document" class="is-ellipsed"/>
            </span>
            <span class="is-pulled-right">
                <icon-forum />
                @{{document.forum_username}}
            </span>
        </div>

        <div slot="row2">
            <activities :activities="document.activities"/>
            &nbsp;
            <span class="is-pulled-right">
                {{document.categories.join(", ")}}
            </span>
        </div>
    </card-container>
</template>

<script>
    import constants from '@/js/constants.js'

    import CardContainer from './utils/CardContainer'
    import CardRegionItem from './utils/CardRegionItem'

    export default {
        components: {
            CardContainer,
            CardRegionItem,
        },

        props: ['document'],

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
