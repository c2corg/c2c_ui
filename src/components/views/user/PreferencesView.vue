<template>
    <div v-if="preferences" class="section content">
        <html-header title="My preferences"/>
        <h1>
            <fa-icon icon="cogs"/>
            <span v-translate>Preferences</span>
        </h1>

        <h2 v-translate>Filter preferences</h2>
        <p v-translate>Here you may set activity and region filters that will apply to the homepage feed.</p>
        <p v-translate>Only status updates with the selected activities and in the selected areas are shown in your homepage feed. Status updates from followed users will always be shown.</p>
        <div class="field">
            <label>
                <input v-model="preferences.followed_only" class="checkbox" type="checkbox" @change="save">
                <span v-translate>Show only updates from followed users in the homepage feed</span>
            </label>
        </div>

        <div v-if="!preferences.followed_only">
            <h2 v-translate>langs</h2>
            <div class="field is-grouped">
                <div v-for="lang of constants.langs" :key="lang" class="control">
                    <button :class="{'is-primary' : preferences.langs.indexOf(lang) > -1}" type="button" class="button"
                            @click="toggle(lang, preferences.langs)">
                        {{ lang }}
                    </button>
                </div>
            </div>

            <h2 v-translate>activities</h2>
            <div class="field is-grouped">
                <div v-for="activity of constants.activities" :key="activity" class="control">
                    <button :class="{'is-primary' : preferences.activities.indexOf(activity) > -1}" type="button" class="button"
                            @click="toggle(activity, preferences.activities)">
                        <icon-activity :activity="activity"/>
                    </button>
                </div>
            </div>

            <h2 v-translate>areas</h2>
            <div class="columns">
                <div v-for="document in preferences.areas" :key="document.document_id" class="column is-2">
                    <document-card :document="document"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import c2c from '@/js/c2c.js'
    import constants from '@/js/constants.js'

    export default {

        data(){
            return {
                preferences:null,
                constants:constants,
            }
        },

        created(){
            c2c.user.preferences.get().then(response => {
                this.preferences = response.data
            })
        },

        methods:{
            toggle(item, array){
                if (array.indexOf(item) > -1) {
                    array.splice(array.indexOf(item), 1)
                } else {
                    array.push(item);
                }

                this.save();

            },

            save(){
                c2c.user.preferences.post(this.preferences)
            }
        },
    }
</script>

<style scoped>

.cards-container > div{
    flex-flow:wrap row;
    justify-content:center;
    margin:auto;
}

</style>
