<template>
    <div v-if="mailinglists" class="section content">
        <html-header title="My mailing lists"/>
        <h1>
            <fa-icon icon="at"/>
            <span v-translate>My mailing lists</span>
        </h1>

        <p v-translate>Here you may change your subscriptions to snow forecast mailing lists.</p>
        <div class="field">
            <div v-for="mailinglist in Object.keys(mailinglists)" :key="mailinglist" class="control">
                <label>
                    <input v-model="mailinglists[mailinglist]" class="checkbox" type="checkbox" @change="save">
                    <span>{{ mailinglist }} list</span>
                </label>
            </div>
        </div>
    </div>
</template>

<script>
    import c2c from '@/apis/c2c'

    export default {

        data(){
            return {
                mailinglists:null,
                constants:c2c,
            }
        },

        created(){
            c2c.userProfile.mailinglists.get().then(response => {
                this.mailinglists = response.data
            })
        },

        methods:{
            save(){
                c2c.userProfile.mailinglists.post(this.mailinglists)
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
