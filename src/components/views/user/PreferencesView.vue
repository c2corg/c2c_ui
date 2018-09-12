<template>
    <div class="section content" v-if="preferences">
        <h1>
            <base-icon class="is-large" iconClass="fas fa-cogs"/>
            <span>Preferences</span>
        </h1>

        <h2>Filter preferences</h2>
        <p>Here you may set activity and region filters that will apply to the homepage feed.</p>
        <p>Only status updates with the selected activities and in the selected areas are shown in your homepage feed. Status updates from followed users will always be shown.</p>
        <div class="field">
            <label>
                <input class="checkbox" type="checkbox" v-model="preferences.followed_only" @change="save">
                <span>Show only updates from followed users in the homepage feed</span>
            </label>
        </div>

        <div v-if="!preferences.followed_only">
            <h2>langs</h2>
            <div class="field is-grouped">
                <div class="control"  v-for="lang of constants.langs" :key="lang">
                    <button type="button" class="button" :class="{'is-primary' : preferences.langs.indexOf(lang) > -1}"
                          @click="toggle(lang, preferences.langs)">
                          {{lang}}
                    </button>
                </div>
            </div>

            <h2>activities</h2>
            <div class="field is-grouped">
                <div class="control"  v-for="activity of constants.activities" :key="activity">
                    <button type="button" class="button" :class="{'is-primary' : preferences.activities.indexOf(activity) > -1}"
                          @click="toggle(activity, preferences.activities)">
                          <icon-activity :activity="activity"/>
                    </button>
                </div>
            </div>

            <h2>areas</h2>
            <div class="columns">
                <div class="column is-2"  v-for="document in preferences.areas" :key="document.document_id">
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

        created(){
            c2c.user.preferences.get().then(response => {
                this.preferences = response.data
            })
        }
    }
</script>

<style scoped>

.cards-container > div{
    flex-flow:wrap row;
    justify-content:center;
    margin:auto;
}

</style>
