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

                <div v-for="field of localeFields" :key="field.name"
                     v-if="!field.activity || document.activities.indexOf(field.activity) != -1">
                    <h2>{{field.label || field.name}}</h2>
                    <textarea
                        class="textarea"
                        v-model="locale[field.name]"/>
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

        props : ["document", "locale", "localeFields"],

        methods:{
        },
    }
</script>
