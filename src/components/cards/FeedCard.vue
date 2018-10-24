<template>
    <div class="card">
        <header class="card-header card-header-title">
            <div>
                <span class="icon is-medium">
                    <img :src="'https://forum.camptocamp.org/user_avatar/forum.camptocamp.org/' + item.user.forum_username + '/36/1_1.png'">
                </span>
                <document-title :document="item.user"/>

                <span>{{ $gettext(actionLine) }}</span>
            </div>
            <icon-document :document-type="documentType" class="is-pulled-right"/>
        </header>
        <div class="card-content">
            <div>
                <document-title :document="item.document"/>
                <br>
                <span v-if="locale && locale.summary">{{ locale.summary }}</span>
                <span v-if="documentType=='outing'">{{ dates }}</span>
            </div>

            <gallery v-if="images.length!=0" :images="images" />

            <div >
                <outing-rating v-if="documentType=='outing'" :outing="item.document"/>
                <route-rating v-else-if="documentType=='route'" :document="item.document"/>


                <card-elevation-item :elevation="item.document.elevation_max" class="is-ellipsed"/>

                <span v-if="item.document.height_diff_up">
                    <icon-height-diff />
                    {{ item.document.height_diff_up }} m
                </span>

                <span v-if="item.document.height_diff_difficulties">
                    <fa-icon icon="arrows-alt-v"/>
                    {{ item.document.height_diff_difficulties }} m
                </span>

            </div>
            <div v-if="item.document.areas" class="is-ellipsed">
                <card-region-item :document="item.document"/>
            </div>
            <div>
                <activities v-if="item.document.activities" :activities="item.document.activities"/>
                <icon-document v-if="item.document.img_count != 0" document-type="image"/>
                <icon-geometry-detail v-if="item.document.geometry && item.document.geometry.has_geom_detail"/>
                <span> {{ item.time | timeAgo }} </span>
                <icon-condition v-if="documentType=='outing'" :condition="item.document.condition_rating"/>
                <icon-quality :quality="item.document.quality" />
            </div>
        </div>
    </div>
</template>

<script>
    import c2c from '@/js/c2c'
    import constants from '@/js/constants.js'

    import cardMixins from '@/components/cards/utils/mixins.js'
    import CardRegionItem from '@/components/cards/utils/CardRegionItem'

    export default{

        components: {
            CardRegionItem,
        },

        mixins: [
            cardMixins,
        ],

        props: {
            item:{
                type:Object,
                required:true
            }
        },

        data(){
            return {
                locale:null,
                actionLine:null,
                images:[],
            }
        },

        computed: {
            documentType(){
                return constants.getDocumentType(this.item['document']['type'])
            }
        },

        created(){
            this.locale = this.$documentUtils.getLocaleSmart(this.item.document)

            this.actionLine = '';

            switch (this.item['change_type']) {
                case 'created':
                    this.actionLine += 'has created a new ';
                    break;
                case 'updated':
                    this.actionLine += 'has updated the ';
                    break;
                case 'added_photos':
                    this.actionLine += 'has added images to ';
                    break;
                default:
                    break;
            }

            this.actionLine += this.documentType;

            const start = this.$moment(this.item['document']['date_start']);
            const end = this.$moment(this.item['document']['date_end']);
            const sameYear = start.year() == end.year();
            const sameMonth = start.month() == end.month();
            const sameDay = start.date() == end.date();

            if (!sameYear)
                this.dates =  start.format('Do MMMM YYYY') + ' - ' + end.format('Do MMMM YYYY');
            else if (!sameMonth)
                this.dates =  start.format('Do MMMM') + ' - ' + end.format('Do MMMM YYYY');
            else if (!sameDay)
                this.dates =  start.format('Do') + ' - ' + end.format('Do MMMM YYYY');
            else
                this.dates = end.format('Do MMMM YYYY');

            if(this.item.image1)
                this.images.push(this.item.image1)

            if(this.item.image2)
                this.images.push(this.item.image2)

            if(this.item.image3)
                this.images.push(this.item.image3)
        },

        methods:{
            getSmallImageUrl:c2c.getSmallImageUrl
        }
    }
</script>



<style scoped lang="scss">

@import '@/assets/sass/variables.scss';

.card{
    background-color:#FFF!important;
    transition:0.2s;
    margin:5px;
    cursor:pointer;
    max-width:600px
}

.card:hover{
    background-color:$hover-background!important;
    transition:0.2s;
}

.card-image-content{
    display:flex;
    overflow: hidden;
}

.has-3-images > div{
    width:33.33%;
    max-height: 275px;
    overflow: hidden;
}

.has-2-images > div{
    width:50%;
}

.has-2-images > div{
    width:100%;
}

.card-image-content > div > img{
    width:100%;
    box-sizing: border-box;
}


</style>
