<template>
    <div v-if="outing" class="section content">
        <h1>
            <icon-document type="outing"/>
            <document-title :document="outing"/>
            <small>{{outing.date_start}}</small>
        </h1>

        <!--  CONTENT  -->
        <gallery :images="outing.associations.images" />

        <div class="columns">
            <div class="column is-9">
                <areas-links :areas="outing.areas"/>

                <pretty-route-link v-for="route of outing.associations.routes"
                            :route="route"
                            :key="route.document_id"/>

                <markdown-section :markdown="outing.locales[0].access_comment" title="Acces comment"/>
                <markdown-section :markdown="outing.locales[0].description" title="Description"/>
                <markdown-section :markdown="outing.locales[0].route_description" title="Route description"/>
                <markdown-section :markdown="outing.locales[0].conditions" title="Conditions"/>
                <markdown-section :markdown="outing.locales[0].avalanches" title="Observations relative to avalanches"/>
                <markdown-section :markdown="outing.locales[0].hut_comment" title="Hut comment"/>
                <markdown-section :markdown="outing.locales[0].timing" title="Timing"/>
            </div>

            <div class="column is-3">

                <div>
                    <users-links :users="outing.associations.users"/>
                    {{outing.locales[0].participants}}
                </div>

                <div v-if="outing.locales[0].weather">
                    <i class="fa fa-cloud"></i>
                    {{outing.locales[0].weather}}
                </div>

                <div v-if="outing.frequentation">
                    <i class="fa fa-users"></i>
                    {{outing.frequentation}}
                </div>

                <div v-if="outing.elevation_min || outing.elevation_max">
                    <label>
                        <span >elevation</span>
                    </label>
                    <span v-if="outing.elevation_min">{{outing.elevation_min}}&nbsp;m</span>
                    <span v-if="outing.elevation_min && outing.elevation_max">/</span>
                    <span v-if="outing.elevation_max">{{outing.elevation_max}}&nbsp;m</span>
                </div>

                <div v-if="outing.height_diff_down || outing.height_diff_up">
                    <label >height difference</label>
                    <span v-if="outing.height_diff_up">+{{outing.height_diff_up}}&nbsp;m</span>
                    <span v-if="outing.height_diff_up && outing.height_diff_down">/</span>
                    <span v-if="outing.height_diff_down">-{{outing.height_diff_down}}&nbsp;m</span>
                </div>

                <div v-if="outing.length_total">
                    <label >total length</label>
                    {{outing.length_total}} m
                </div>

                <div v-if="outing.hut_status">
                    <label >hut status</label>
                    {{outing.hut_status }}
                </div>

                <div v-if="outing.snow_quality">
                    <label >snow quality</label>
                    {{outing.snow_quality }}
                </div>

                <div v-if="outing.snow_quantity">
                    <label >snow quantity</label>
                    {{outing.snow_quantity }}
                </div>

                <document-license :document="outing" cc="by-nc-nd"/>

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

    import c2c from '@/js/c2c.js'

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

        data() {
            return {
                outing: null,
            }
        },

        created() {
            c2c.outing.get(this.$route.params.id).then(response => {this.outing=response.data});
        }

    }
</script>
