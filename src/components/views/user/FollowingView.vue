<template>
    <div class="section">
        <html-header :title="$gettext('Followed users')"/>
        <h1 class="title is-1" v-translate>
            Followed users
        </h1>
        <p v-translate>
            Here is the list of users you are following and whose activity you will see in your personal feed.
        </p>

        <document-finder document-type="profile" v-model="newUser" @input="addUser()"/>

        <div v-if="following.data" class="columns is-multiline">
            <div
                v-for="document in following.data.following"
                :key="document.document_id"
                class="column is-3">
                <document-card
                    :document="document"
                    show-delete-button
                    @delete="removeUser(document)"/>
            </div>
        </div>

    </div>
</template>

<script>
    import c2c from '@/js/c2c'

    export default {

        data(){
            return {
                following:null,
                newUser:null,
            }
        },

        created(){
            this.load()
        },

        methods: {
            load(){
                this.following = c2c.userProfile.following.get()
            },

            addUser(){
                c2c.userProfile.following.add(this.newUser.document_id).then(() => {
                    this.load()
                })
            },

            removeUser(document){
                c2c.userProfile.following.remove(document.document_id).then(() => {
                    this.load()
                })
            }
        }
    }
</script>
