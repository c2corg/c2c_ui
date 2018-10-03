<template>
    <div class="section">
        <html-header title="Dashboard"/>
        <content-box>
            <h2 class="title is-2" v-translate>Images</h2>
            <loading-notification :promise="imagesPromise" />
            <gallery v-if="images!=null" :images="images.documents" />
        </content-box>

        <div class="columns">
            <div class="column is-7">
                <content-box>
                    <h2 class="title is-2" v-translate>Outings</h2>
                    <loading-notification :promise="outingsPromise" />
                    <div v-if="outings!=null">
                        <div v-for="outing of outings.documents" :key="outing.document_id">
                            <dashboard-outing-link :outing="outing"/>
                        </div>
                    </div>
                </content-box>
            </div>

            <div class="column">
                <content-box>
                    <h2 class="title is-2" v-translate>Forum</h2>
                    <div v-if="latest_topics && latest_topics.topic_list">
                        <div v-for="topic of latest_topics.topic_list.topics.slice(0, 20)" v-if="topic.category_id != 29"
                             :key="topic.id">

                            <a :href="forum.url + '/t/' + topic.slug + '/' + topic.id + '/' + topic.highest_post_number"
                               target="_blank">

                                <img :src="forum.url + topic.last_poster_user.avatar_template.replace('{size}','16')" height="16"
                                     width="16">

                                {{ topic.title }}
                            </a>
                        </div>
                    </div>
                </content-box>

                <content-box>
                    <h2 class="title is-2 box-header" v-translate>Routes</h2>
                    <loading-notification :promise="routesPromise" />
                    <div v-if="routes!=null">
                        <div v-for="route of routes.documents" :key="route.document_id">
                            <pretty-route-link :route="route" :show-area="true"/>
                        </div>
                    </div>
                </content-box>
            </div>
        </div>
    </div>
</template>

<script>

    import c2c from '@/js/c2c.js'
    import forum from '@/js/forum.js'

    import DashboardOutingLink from './DashboardOutingLink'

    export default {

        components: {
            DashboardOutingLink,
        },

        data() {
            return {


                outingsPromise: null,
                routesPromise: null,
                imagesPromise: null,


                latest_topics: [],

                forum,
            }
        },

        computed: {
            swiper() {
                return this.$refs.mySwiper.swiper
            },

            outings(){
                return this.outingsPromise.data
            },

            images(){
                return this.imagesPromise.data
            },

            routes(){
                return this.routesPromise.data
            },
        },

        created() {

            this.outingsPromise = c2c.outings.get()
            this.routesPromise = c2c.routes.get({limit:10})
            this.imagesPromise = c2c.images.get()

            forum.getLatest()
            .then(response => {  this.latest_topics = response.data;    })

        }
    }

</script>

<style scoped>
h2{
    padding-bottom:0.7rem !important;
    margin-bottom:0.7rem !important;
    border-bottom:1px solid #DDD;
}
</style>
