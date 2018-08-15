<template>
    <div>
        <!--  CONTENT  -->
        <gallery :images="document.associations.images" />

        <div class="columns">
            <div class="column is-9">
                <areas-links :areas="document.areas"/>

                <pretty-route-link v-for="route of document.associations.routes"
                            :route="route"
                            :key="route.document_id"/>

                <markdown-section :markdown="locale.access_comment" title="Acces comment"/>
                <markdown-section :markdown="locale.description" title="Description"/>
                <markdown-section :markdown="locale.route_description" title="Route description"/>
                <markdown-section :markdown="locale.conditions" title="Conditions"/>
                <markdown-section :markdown="locale.avalanches" title="Observations relative to avalanches"/>
                <markdown-section :markdown="locale.hut_comment" title="Hut comment"/>
                <markdown-section :markdown="locale.timing" title="Timing"/>
            </div>

            <div class="column is-3">

                <div>
                    <users-links :users="document.associations.users"/>
                    {{locale.participants}}
                </div>

                <div v-if="locale.weather">
                    <i class="fa fa-cloud"></i>
                    {{locale.weather}}
                </div>

                <div v-if="document.frequentation">
                    <i class="fa fa-users"></i>
                    {{document.frequentation}}
                </div>

                <div v-if="document.elevation_min || document.elevation_max">
                    <label>
                        <span >elevation</span>
                    </label>
                    <span v-if="document.elevation_min">{{document.elevation_min}}&nbsp;m</span>
                    <span v-if="document.elevation_min && document.elevation_max">/</span>
                    <span v-if="document.elevation_max">{{document.elevation_max}}&nbsp;m</span>
                </div>

                <div v-if="document.height_diff_down || document.height_diff_up">
                    <label >height difference</label>
                    <span v-if="document.height_diff_up">+{{document.height_diff_up}}&nbsp;m</span>
                    <span v-if="document.height_diff_up && document.height_diff_down">/</span>
                    <span v-if="document.height_diff_down">-{{document.height_diff_down}}&nbsp;m</span>
                </div>

                <div v-if="document.length_total">
                    <label >total length</label>
                    {{document.length_total}} m
                </div>

                <div v-if="document.hut_status">
                    <label >hut status</label>
                    {{document.hut_status }}
                </div>

                <div v-if="document.snow_quality">
                    <label >snow quality</label>
                    {{document.snow_quality }}
                </div>

                <div v-if="document.snow_quantity">
                    <label >snow quantity</label>
                    {{document.snow_quantity }}
                </div>

                <document-license :document="document" cc="by-nc-nd"/>

            </div>
        </div>

    </div>
</template>

<script>
    import Markdown from '@/components/Markdown'
    import MarkdownSection from '@/components/utils/MarkdownSection'
    import Activities from '@/components/utils/Activities'
    import RouteRating from '@/components/utils/RouteRating'
    import DocumentLicense from '@/components/utils/DocumentLicense'
    import Gallery from '@/components/utils/Gallery'
    import AreasLinks from '@/components/views/document/utils/AreasLinks'

    import UsersLinks from '@/components/views/document/utils/UsersLinks'

    export default {

        components: {
            Markdown,
            MarkdownSection,
            Activities,
            DocumentLicense,
            RouteRating,
            Gallery,
            UsersLinks,
            AreasLinks
        },

        props:["document", "locale"],
    }
</script>
