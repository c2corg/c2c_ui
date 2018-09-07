<template>
    <div class="card" @click="go">
        <header class="card-header">
            <document-title class="card-header-title" :document="document"/>
        </header>
        <div class="card-content">
            <component :is="cardComponentName" :document="document"/>
        </div>
    </div>
</template>

<script>
    import RouteCardContent from '@/components/cards/content/RouteCardContent'
    import OutingCardContent from '@/components/cards/content/OutingCardContent'
    import WaypointCardContent from '@/components/cards/content/WaypointCardContent'
    import ArticleCardContent from '@/components/cards/content/ArticleCardContent'
    import MapCardContent from '@/components/cards/content/MapCardContent'
    import AreaCardContent from '@/components/cards/content/AreaCardContent'
    import BookCardContent from '@/components/cards/content/BookCardContent'
    import ProfileCardContent from '@/components/cards/content/ProfileCardContent'
    import XreportCardContent from '@/components/cards/content/XreportCardContent'

    import constants from '@/js/constants.js'

    export default {
        components: {

            OutingCardContent,
            RouteCardContent,
            WaypointCardContent,
            ArticleCardContent,
            AreaCardContent,
            BookCardContent,
            MapCardContent,
            ProfileCardContent,
            XreportCardContent,
        },

        props: ['document'],

        data() {
            return {
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

        created() {
            this.cardComponentName = constants.getDocumentType(this.document.type) + "-card-content"
        },
    }

</script>

<style scoped>

.card{
    background-color:#F1FAF8!important;
    transition:0.2s;
    margin-left:1px;
    margin-top:1px;
    margin-right:10px;
    margin-bottom:10px;
    cursor:pointer;
    flex: 1 1 300px;
}

.card:hover{
    background-color:#fff8f0!important;
    transition:0.2s;
}
</style>
