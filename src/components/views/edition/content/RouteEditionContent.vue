<template>
    <div>
        <tab-view>

            <tab-item title="Route">
                <div class="field">
                      <div class="control">
                          <h2>Title</h2>
                          <input class="input is-primary" type="text" v-model="locale.title">
                      </div>
                </div>

                <div v-for="locale_field of locale_fields" :key="locale_field">
                    <h2>{{locale_field}}</h2>
                    <textarea
                        class="textarea"
                        v-model="locale[locale_field]"/>
                </div>
            </tab-item>

            <tab-item title="Figures">
                plein de figures
            </tab-item>

            <tab-item title="Route &amp; Associations">
                plein de asso
            </tab-item>

        </tab-view>
    </div>
</template>

<script>
    import TabView from './../utils/TabView'
    import TabItem from './../utils/TabItem'

    export default {
        components:{
            TabView,
            TabItem
        },

        props : ["document", "locale"],

        data(){
            return {
                locale_fields:["summary","description"]
            }
        },
    }
</script>
