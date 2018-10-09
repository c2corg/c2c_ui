<template>
    <div v-if="preferences" class="section content">
        <html-header title="My preferences"/>

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
                <input-activity v-model="preferences.activities" @input="save"/>
            </div>

            <h2 v-translate>Areas</h2>

            <document-finder type="area" @input="addArea(arguments[0])"/>

            <div class="columns">
                <div
                    v-for="document in preferences.areas"
                    :key="document.document_id"
                    class="column is-2">
                    <document-card
                        :document="document"
                        show-delete-button
                        @delete="removeArea(document)"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import c2c from '@/js/c2c'
    import constants from '@/js/constants.js'

    export default {

        data(){
            return {
                preferences:null,
                constants:constants,
            }
        },

        created(){
            c2c.userProfile.preferences.get().then(response => {
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

                this.save()
            },

            addArea(area){
                this.preferences.areas.push(area)
                this.save()
            },

            removeArea(area){
                this.preferences.areas = this.preferences.areas.filter(doc => doc.document_id != area.document_id)
                this.save()
            },

            save(){
                c2c.userProfile.preferences.post(this.preferences)
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
