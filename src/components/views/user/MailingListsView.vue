<template>
    <div v-if="mailinglists" class="section content">
        <h1>
            <fa-icon icon="at"/>
            <span>My mailing lists</span>
        </h1>

        <p>Here you may change your subscriptions to snow forecast mailing lists.</p>
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
    import c2c from '@/js/c2c.js'

    export default {

        data(){
            return {
                mailinglists:null,
                constants:c2c,
            }
        },

        created(){
            c2c.user.mailinglists.get().then(response => {
                this.mailinglists = response.data
            })
        },

        methods:{
            save(){
                c2c.user.mailinglists.post(this.mailinglists)
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
