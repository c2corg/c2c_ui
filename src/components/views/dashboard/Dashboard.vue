<template>
    <div class="section content">
        <div class="columns">
            <div class="column home-images">
                <h2>Images</h2>
                <loading-notification :loaded="images!=null" :error="imagesError" />
                <gallery v-if="images!=null" :images="images.documents" />
            </div>
        </div>
        <div class="columns">
            <div class="column is-7">
                <div>
                    <h2>Outings</h2>
                    <loading-notification :loaded="outings!=null" :error="outingsError"/>
                    <div v-if="outings!=null">
                        <div v-for="outing of outings.documents" :key="outing.document_id">
                            <dashboard-outing-link :outing="outing"/>
                        </div>
                    </div>
                </div>
            </div>
            <div class="column home-right">
                <h2>Forum</h2>
                <div v-if="latest_topics && latest_topics.topic_list">
                    <div v-for="topic of latest_topics.topic_list.topics.slice(0, 20)"
                         v-if="topic.category_id != 29" :key="topic.id">

                        <a :href="forum.url + '/t/' + topic.slug + '/' + topic.id + '/' + topic.highest_post_number"
                           target="_blank">

                           <img height="16" width="16"
                                :src="forum.url + topic.last_poster_user.avatar_template.replace('{size}','16')">


                            {{topic.title}}
                        </a>


                    </div>
                </div>
                <div>
                    <h2>Routes</h2>
                    <loading-notification :loaded="routes!=null" :error="routesError"/>
                    <div v-if="routes!=null">
                        <div v-for="route of routes.documents" :key="route.document_id">
                            <pretty-route-link :route="route" showArea="true"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

    import DashboardOutingLink from '@/components/views/dashboard/DashboardOutingLink'

    import c2c from '@/js/c2c.js'
    import forum from '@/js/forum.js'

    export default {

        components: {
            DashboardOutingLink,
        },

        data() {
            return {

                routes: null,
                images: null,
                outings: null,

                routesError: null,
                imagesError: null,
                outingsError: null,

                latest_topics: [],

                forum,
            }
        },

        computed: {
            swiper() {
                return this.$refs.mySwiper.swiper
            }
        },

        created() {

            c2c.outings.get()
            .then(response => {  this.outings = response.data;    })
            .catch(response => {this.outingsError = response})

            c2c.routes.get({limit:10})
            .then(response => {  this.routes = response.data;    })
            .catch(response => {this.routesError = response})

            c2c.images.get()
            .then(response => {  this.images = response.data;    })
            .catch(response => { this.imagesError=response    })

            forum.getLatest()
            .then(response => {  this.latest_topics = response.data;    })

        }
    }

</script>
