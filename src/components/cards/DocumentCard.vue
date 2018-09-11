<template>
    <content-box class="document-card" @click="go">
        <header class="document-card-header">
            <document-title class="document-card-header-title" :document="document"/>
        </header>
        <div class="document-card-content">
            <component :is="cardComponentName" :document="document"/>
        </div>
    </content-box>
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


<style scoped lang="scss">

@import '@/assets/sass/main.scss';

$card-header-border : 1px solid $border;
$card-hover-background : #fff8f0!important;

.document-card{
    transition:0.1s;
    cursor:pointer;
}

.document-card:hover{
    background:$white-ter;
    transition:0.2s;
}

.document-card-header{
    font-weight:bold;
}

.document-card-header-title {
    display:block;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.document-card-content{

}


</style>
