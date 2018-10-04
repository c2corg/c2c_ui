<template>
    <div class="section">
        <html-header title="Followed users"/>
        <div v-if="following" class="columns">
            <div v-for="document in following.following" :key="document.document_id" class="column is-3">
                <document-card :document="document"/>
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
            }
        },

        created(){
            c2c.userProfile.following.get().then(response => { this.following = response.data})
        }
    }
</script>
