<template>
    <div>
        <html-header :title="$gettext('Topoguide')"/>
        <div class="topoguide">
            <h1 class="has-text-centered has-text-weight-semibold" v-translate>
                Topoguide
            </h1>
            <div class="links is-flex">
                <topoguide-view-link to="outings" :label="$gettext('Outings')" icon="icon-outing"/>
                <topoguide-view-link to="routes" :label="$gettext('Routes')" icon="icon-route"/>
                <topoguide-view-link to="waypoints" :label="$gettext('Waypoints')" icon="icon-waypoint"/>
                <topoguide-view-link to="images" :label="$gettext('Images')" icon="icon-image"/>
                <topoguide-view-link to="books" :label="$gettext('Books')" icon="icon-book"/>
                <topoguide-view-link to="areas" :label="$gettext('Areas')" icon="icon-area"/>
            </div>
        </div>
        <div class="section columns is-multiline is-variable is-8">
            <div class="column is-6">
                <h2 class="title is-2 has-text-centered has-background-primary has-text-light" v-translate>Outings</h2>
                <div class="columns is-multiline is-variable is-1">
                    <topoguide-view-small-link
                        class="column is-3"
                        v-for="activity of activities"
                        :key="activity"
                        :to="{name:'outings', query:{act:activity}}">
                        <span class="is-size-2"><icon-activity :activity="activity" /></span>
                        <span class="has-text-dark has-text-weight-semibold">{{ $gettext(activity) }}</span>
                    </topoguide-view-small-link>

                    <topoguide-view-small-link
                        class="column is-3"
                        :to="{name:'outing-add'}">
                        <span class="is-size-2"><fa-icon icon="plus" /></span>
                        <span class="has-text-dark has-text-weight-semibold" v-translate>
                            New outing
                        </span>
                    </topoguide-view-small-link>
                </div>
            </div>
            <div class="column is-6">
                <h2 class="title is-2 has-text-centered has-background-primary has-text-light" v-translate>Routes</h2>
                <div class="columns is-multiline is-variable is-1">
                    <topoguide-view-small-link
                        class="column is-3"
                        v-for="activity of activities"
                        :key="activity"
                        :to="{name:'routes', query:{act:activity}}">
                        <span class="is-size-2"><icon-activity :activity="activity" /></span>
                        <span class="has-text-dark has-text-weight-semibold">{{ $gettext(activity) }}</span>
                    </topoguide-view-small-link>

                    <topoguide-view-small-link
                        class="column is-3"
                        :to="{name:'route-add'}">
                        <span class="is-size-2"><fa-icon icon="plus" /></span>
                        <span class="has-text-dark has-text-weight-semibold" v-translate>
                            New route
                        </span>
                    </topoguide-view-small-link>
                </div>
            </div>
            <div class="column is-12">
                <h2 class="title is-2 has-text-centered has-background-primary has-text-light" v-translate>Waypoints</h2>
                <div class="columns is-multiline is-variable is-1">
                    <topoguide-view-small-link
                        class="column is-2"
                        v-for="waypoint_type of waypoint_types"
                        :key="waypoint_type"
                        :to="{name:'waypoints', query:{wtyp:waypoint_type}}">
                        <span class="is-size-2"><icon-waypoint-type :waypoint-type="waypoint_type" /></span>
                        <span class="has-text-dark has-text-weight-semibold is-first-letter-uppercase">
                            {{ $gettext(waypoint_type) }}
                        </span>
                    </topoguide-view-small-link>

                    <topoguide-view-small-link
                        class="column is-2"
                        :to="{name:'waypoint-add'}">
                        <span class="is-size-2"><fa-icon icon="plus" /></span>
                        <span class="has-text-dark has-text-weight-semibold" v-translate>
                            New waypoint
                        </span>
                    </topoguide-view-small-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import constants from "@/js/constants"

    import TopoguideViewLink from "./TopoguideViewLink"
    import TopoguideViewSmallLink from "./TopoguideViewSmallLink"

    export default {
        components: {
            TopoguideViewLink,
            TopoguideViewSmallLink,
        },

        computed:{
            activities(){
                return constants.activities
            },
            waypoint_types(){
                return constants.waypoint_types
            }
        }
    }

</script>

<style scoped lang="scss">
    @import '@/assets/sass/variables.scss';

    .topoguide{
        background-image:url(https://www.camptocamp.org/static/img/home/laurentf-sajama.jpg);
        background-size:cover;
        padding-top:10px;
        padding-bottom:100px;
        justify-content:center;

        h1{
            font-size:3rem;
            color:$light;
        }

        .links{
            justify-content:center;
            flex-flow:wrap row;
            max-width:550px;
            margin:auto;
        }
    }
</style>
