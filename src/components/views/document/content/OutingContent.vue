<template>
    <div>
        <!--  CONTENT  -->

        <content-box v-if="document.associations && document.associations.images.length" >
            <gallery :images="document.associations.images" />
        </content-box>

        <div class="columns">

            <div class="column is-3">
                <content-box>
                    <label-value label="Ratings">
                        <outing-rating :outing="document"></outing-rating>
                    </label-value>

                    <label-value v-if="locale.weather" label="weather">
                        {{locale.weather}}
                    </label-value>

                    <field-view :document="document" :field="fields.frequentation"></field-view>

                    <label-value v-if="document.elevation_min || document.elevation_max" label="elevation">
                        <span v-if="document.elevation_min">{{document.elevation_min}}&nbsp;m</span>
                        <span v-if="document.elevation_min && document.elevation_max">/</span>
                        <span v-if="document.elevation_max">{{document.elevation_max}}&nbsp;m</span>
                    </label-value>

                    <label-value v-if="document.height_diff_down || document.height_diff_up" label="height difference">
                        <span v-if="document.height_diff_up">+{{document.height_diff_up}}&nbsp;m</span>
                        <span v-if="document.height_diff_up && document.height_diff_down">/</span>
                        <span v-if="document.height_diff_down">-{{document.height_diff_down}}&nbsp;m</span>
                    </label-value>

                    <field-view :document="document" :field="fields.length_total"></field-view>
                    <field-view :document="document" :field="fields.hut_status"></field-view>
                    <field-view :document="document" :field="fields.snow_quality"></field-view>
                    <field-view :document="document" :field="fields.snow_quantity"></field-view>

                </content-box>

                <map-box :document="document"></map-box>
                <license-box cc="by-sa" />
            </div>

            <div class="column is-9">

                <content-box>
                    <div>
                        <users-links :users="document.associations.users"/>
                        {{locale.participants}}
                    </div>

                    <pretty-route-link v-for="route of document.associations.routes" :key="route.document_id"
                                :route="route"/>

                    <markdown-section :document="document" :locale="locale" :field="fields.description" />
                    <markdown-section :document="document" :locale="locale" :field="fields.access_comment" />
                    <markdown-section :document="document" :locale="locale" :field="fields.route_description" />
                    <markdown-section :document="document" :locale="locale" :field="fields.conditions"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.avalanches"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.hut_comment"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.timing"/>

                </content-box>

                <comments-box :document="document" :locale="locale" />

            </div>

        </div>
    </div>
</template>

<script>

    import Markdown from './utils/Markdown'
    import MarkdownSection from './utils/MarkdownSection'
    import UsersLinks from './utils/UsersLinks'
    import CommentsBox from './utils/CommentsBox'
    import LicenseBox from './utils/LicenseBox'
    import MapBox from './utils/MapBox'
    import LabelValue from './utils/LabelValue'
    import FieldView from './utils/FieldView'

    export default {

        components: {
            Markdown,
            MarkdownSection,
            UsersLinks,
            CommentsBox,
            LicenseBox,
            MapBox,
            LabelValue,
            FieldView,
        },

        props:["document", "locale", "fields"],
    }
</script>
