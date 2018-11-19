<template>
    <card-container class="route-card" @click="go">
        <div slot="header" class="level">
            <!-- TODO : good from url -->
            <img class="level-left avatar"
                 :src="'https://forum.camptocamp.org/user_avatar/forum.camptocamp.org/' + item.user.forum_username + '/36/1_1.png'">

            <span class="level-left">
                <document-title :document="item.user"/>
                <span>&nbsp;{{ $gettext(actionLine) }}</span>
            </span>

            <icon-document :document-type="documentType" class="is-pulled-right is-size-3"/>
        </div>
        <div slot="row1">
            <div>
                <document-title :document="item.document"/>
                <br>
                <markdown v-if="locale && locale.summary" :content="locale.summary" />
                <span v-if="documentType=='outing'">{{ dates }}</span>
                <gallery v-if="images.length!=0" :images="images" />
            </div>
        </div>
        <div slot="row3" v-if="documentType!='article'" class="level">
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
        <div v-if="item.document.areas" slot="row4" class="level">
            <card-region-item :document="item.document"/>
        </div>
        <div slot="row5" class="level">
            <activities v-if="item.document.activities" :activities="item.document.activities" class="is-size-3"/>
            <span>
                <marker-image-count :image-count="item.document.img_count" />
                <icon-geometry-detail v-if="item.document.geometry && item.document.geometry.has_geom_detail"/>
            </span>
            <span> {{ item.time | timeAgo }} </span>
            <span>
                <icon-condition v-if="documentType=='outing'" :condition="item.document.condition_rating"/>
                <icon-quality :quality="item.document.quality" />
            </span>
        </div>
    </card-container>
</template>

<script>
    import imageUrls from '@/js/image-urls'

    import { cardMixin } from './utils/mixins.js'

    export default{

        mixins: [
            cardMixin,
        ],

        props: {
            item:{
                type:Object,
                required:true
            }
        },

        data(){
            return {
                actionLine:null,
                images:[],
            }
        },

        computed: {
            document(){
                return this.item.document
            },
            documentType(){
                return this.$documentUtils.getDocumentType(this.document['type'])
            },
            locale(){
                return this.$documentUtils.getLocaleSmart(this.item.document)
            }
        },

        created(){

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
            getSmallImageUrl:imageUrls.getSmall
        }
    }
</script>



<style scoped lang="scss">

@import '@/assets/sass/variables.scss';

    .card{
        background-color:#FFF!important;
        transition:0.2s;
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

    .avatar{
        border-radius: 50%;
        width: 36px;
        height: 36px;
        vertical-align: bottom;
        margin-right: 0.5rem;
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
