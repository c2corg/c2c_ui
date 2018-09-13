<template>
    <div v-if="!document.not_authorized">

        <div class="columns">

            <div class="column is-3">
                <content-box>
                    <activities :activities="document.activities"/>

                    <label-value label="forum">
                        @{{document.forum_username}}
                    </label-value>

                    <field-view :document="document" :field="fields.categories"/>

                    <div>
                        <router-link :to="{ name: 'whatsnew', query: {u:$route.params.id} }">
                            contributions
                        </router-link>
                    </div>
                </content-box>

                <map-box :document="document" />

                <license-box :document="document" cc="by-nc-nd"/>

            </div>

            <div class="column">
                <content-box>
                    <summary>
                        <markdown :content="locale.summary"/>
                    </summary>

                    <markdown :content="locale.description"/>
                </content-box>

            </div>
        </div>
    </div>
    <div v-else>
        You're not authorized. Please sign-in or create an account
    </div>
</template>

<script>
    import Markdown from './utils/Markdown'
    import LabelValue from './utils/LabelValue'
    import FieldView from './utils/FieldView'
    import LicenseBox from './utils/LicenseBox'
    import MapBox from './utils/MapBox'

    export default {

        components: {
            Markdown,
            LabelValue,
            FieldView,
            LicenseBox,
            MapBox,
        },

        props:["document", "locale", "fields"],
    }
</script>
