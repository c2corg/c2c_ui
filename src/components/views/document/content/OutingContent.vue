<template>
    <div>
        <!--  CONTENT  -->
        <gallery :images="document.associations.images" />

        <div class="columns">
            <div class="column is-9">
                <areas-links :areas="document.areas"/>

                <pretty-route-link v-for="route of document.associations.routes" :key="route.document_id"
                            :route="route"/>

                <markdown-section :document="document" :locale="locale" :field="fields.description" />
                <markdown-section :document="document" :locale="locale" :field="fields.access_comment" />
                <markdown-section :document="document" :locale="locale" :field="fields.route_description" />
                <markdown-section :document="document" :locale="locale" :field="fields.conditions"/>
                <markdown-section :document="document" :locale="locale" :field="fields.avalanches"/>
                <markdown-section :document="document" :locale="locale" :field="fields.hut_comment"/>
                <markdown-section :document="document" :locale="locale" :field="fields.timing"/>

                <document-comments :document="document" :locale="locale" />

            </div>

            <div class="column is-3">

                <div>
                    <users-links :users="document.associations.users"/>
                    {{locale.participants}}
                </div>

                <div v-if="locale.weather">
                    <base-icon iconClass="fa fa-cloud"/>
                    {{locale.weather}}
                </div>

                <div v-if="document.frequentation">
                    <icon-users />{{document.frequentation}}
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

                <map-view :document="document" />
                <document-license :document="document" cc="by-nc-nd"/>
            </div>
        </div>
    </div>
</template>

<script>

    import Markdown from './utils/Markdown'
    import MarkdownSection from './utils/MarkdownSection'
    import AreasLinks from './utils/AreasLinks'
    import UsersLinks from './utils/UsersLinks'
    import DocumentComments from './utils/DocumentComments'

    export default {

        components: {
            Markdown,
            MarkdownSection,
            UsersLinks,
            AreasLinks,
            DocumentComments,
        },

        props:["document", "locale", "fields"],
    }
</script>
