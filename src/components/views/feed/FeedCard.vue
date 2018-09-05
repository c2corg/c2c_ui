<template>
    <div class="card">
        <header class="card-header card-header-title">
            <div>
                <span class="icon is-medium">
                    <img :src="'https://forum.camptocamp.org/user_avatar/forum.camptocamp.org/' + item.user.forum_username + '/36/1_1.png'">
                </span>
                <document-title :document="item.user"/>
                <span>{{actionLine}}</span>
            </div>
            <icon-document class="is-pulled-right" :type="item.document.type"/>
        </header>
        <div class="card-content">
            <div>
                <document-title :document="item.document"/>
                <br>
                <span v-if="locale && locale.summary">{{locale.summary}}</span>
                <span v-if="item.document.type=='o'">{{dates}}</span>
            </div>

            <gallery v-if="images.length!=0" :images="images" />

            <div >
                <outing-rating :outing="item.document" v-if="item.document.type=='o'"/>
                <route-rating :route="item.document" v-else-if="item.document.type=='r'"/>


                <span v-if="item.document.elevation_max">
                    <base-icon iconClass="fas fa-bomb"/>
                    {{item.document.elevation_max}} m
                </span>

                <span v-if="item.document.height_diff_up">
                    <base-icon iconClass="fas fa-bomb"/>
                    {{item.document.height_diff_up}} m
                </span>

                <span v-if="item.document.height_diff_difficulties">
                    <base-icon iconClass="fas fa-arrows-alt-v"/>
                    {{item.document.height_diff_difficulties}} m
                </span>

            </div>
            <div v-if="item.document.areas">
                <card-region-item :document="item.document"/>
            </div>
            <div>
                <activities :activities="item.document.activities"/>
                <icon-document type="image" v-if="item.document.img_count != 0"/>
                <icon-geometry-detail v-if="item.document.geometry && item.document.geometry.has_geom_detail"/>
                <span> {{ item.time |  timeAgo }} </span>
                <icon-condition :condition="item.document.condition_rating" v-if="item.document.type=='o'"/>
                <icon-quality :quality="item.document.quality" />
            </div>
        </div>
    </div>
</template>

<script>
    const moment = require('moment')
    import user from '@/js/user.js'
    import c2c from '@/js/c2c.js'
    import constants from '@/js/constants.js'
    import CardRegionItem from '@/components/cards/utils/CardRegionItem'

    export default{
        props:["item"],

        components:{
            CardRegionItem,
        },

        data(){
            return {
                locale:null,
                actionLine:null,
                images:[],
            }
        },

        created(){
            this.locale = user.getLocaleSmart(this.item.document)

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

            this.actionLine += constants.getDocumentType(this.item['document']['type']);


            const start = moment(this.item['document']['date_start']);
            const end = moment(this.item['document']['date_end']);
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



<style scoped>


.card{
    background-color:#FFF!important;
    transition:0.2s;
    margin:5px;
    cursor:pointer;
    max-width:600px
}

.card:hover{
    background-color:#fff8f0!important;
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
