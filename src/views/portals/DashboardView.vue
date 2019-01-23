<template>
    <div class="section">
        <html-header title="Dashboard"/>
        <div class="box">
            <h3 class="title is-3">
                {{ $gettext('images') | uppercaseFirstLetter }}
            </h3>
            <loading-notification :promise="imagesPromise" />
            <gallery v-if="images!=null" :images="images.documents" />
        </div>

        <div class="columns">
            <div class="column is-7">
                <div class="box">
                    <h3 class="title is-2">
                        {{ $gettext('outings') | uppercaseFirstLetter }}
                    </h3>
                    <loading-notification :promise="outingsPromise" />
                    <div v-if="outings!=null">
                        <div v-for="outing of outings.documents" :key="outing.document_id">
                            <dashboard-outing-link :outing="outing"/>
                        </div>
                    </div>
                </div>
            </div>

            <div class="column">
                <div class="box">
                    <h3 class="title is-3" v-translate>Forum</h3>
                    <forum-widget :message-count="20"/>
                </div>

                <div class="box">
                    <h3 class="title is-3">
                        {{ $gettext('routes') | uppercaseFirstLetter }}
                    </h3>
                    <loading-notification :promise="routesPromise" />
                    <div v-if="routes!=null">
                        <div v-for="route of routes.documents" :key="route.document_id">
                            <pretty-route-link :route="route"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

    import c2c from '@/js/apis/c2c'

    import DashboardOutingLink from './utils/DashboardOutingLink'
    import ForumWidget from './utils/ForumWidget'
    import Gallery from '@/components/gallery/Gallery'

    export default {

        components: {
            DashboardOutingLink,
            ForumWidget,
            Gallery
        },

        data() {
            return {
                outingsPromise: null,
                routesPromise: null,
                imagesPromise: null
            }
        },

        computed: {
            outings() {
                return this.outingsPromise.data
            },

            images() {
                return this.imagesPromise.data
            },

            routes() {
                return this.routesPromise.data
            }
        },

        created() {
            this.outingsPromise = c2c.outing.getAll()
            this.routesPromise = c2c.route.getAll({ limit: 10 })
            this.imagesPromise = c2c.image.getAll()
        }
    }

</script>

<style scoped>
h3{
    padding-bottom:0.7rem !important;
    margin-bottom:0.7rem !important;
    border-bottom:1px solid #DDD;
}
</style>
