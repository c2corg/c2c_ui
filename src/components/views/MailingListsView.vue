<template>
    <div class="section content" v-if="mailinglists">
        <h1>
            <base-icon class="is-large" iconClass="fas fa-at"/>
            <span>My mailing lists</span>
        </h1>

        <p>Here you may change your subscriptions to snow forecast mailing lists.</p>
        <div class="field">
            <div class="control" v-for="mailinglist in Object.keys(mailinglists)" :key="mailinglist">
                <label>
                    <input class="checkbox" type="checkbox" v-model="mailinglists[mailinglist]" @change="save">
                    <span>{{mailinglist}} list</span>
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

        methods:{
            save(){
                c2c.user.mailinglists.post(this.mailinglists)
            }
        },

        created(){
            c2c.user.mailinglists.get().then(response => {
                this.mailinglists = response.data
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
