<template>
    <content-box class="discourse-comments">
        <h2 class="title is-2" v-translate>Comments</h2>

        <div v-if="errorMessage" class="notification is-danger">
            <p>
                <span v-translate>Oups! Something went wrong with forum. Here is the message :</span>
                <br>
                {{ errorMessage }}
            </p>
        </div>

        <div v-if="locale.topic_id === null">
            <div v-if="document.disable_comments">
                <p v-translate>Comments are disabled.</p>
            </div>

            <div v-else>
                <p v-if="!user.isLogged()" v-translate>Log in to post the first comment</p>
                <button v-else class="button is-primary" @click="createTopic" v-translate>
                    Post the first comment
                </button>
            </div>
        </div>

        <div v-if="comments.length > 0">
            <div v-for="post of comments" :key="post.id" class="discourse-post">
                <div class="columns is-gapless">
                    <div class="column is-narrow discourse-post-avatar">
                        <img :src="post.avatar_template" :width="forum_avatar_size" :height="forum_avatar_size">
                    </div>
                    <div class="column">
                        <div class="discourse-post-header">
                            <a :href="'https://forum.camptocamp.org/users/' + post.username" :title="post.username"
                               class="discourse-post-header-username">
                                {{ post.username }}
                            </a>
                            <span class="is-pulled-right">
                                {{ post['created_at'] | timeAgo }}
                            </span>
                        </div>

                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <div class="discourse-content" v-html="post.cooked"/>

                    </div>
                </div>
            </div>

            <div class="has-text-centered">
                <a :href="forum.url + '/t/' + topic.slug + '/' + locale.topic_id + '/' + topic.posts_count"
                   class="button is-primary" v-translate>
                    Continue the discussion
                </a>
            </div>
        </div>
    </content-box>
</template>

<script>
    import { requireDocumentProperty, requireLocaleProperty} from '@/js/propertiesMixins.js'

    import forum from '@/js/forum.js'
    import user from '@/js/user.js'

    export default {
        mixins : [ requireDocumentProperty, requireLocaleProperty ],

        data(){
            return {
                forum,
                user,
                topic:null,
                comments:[],
                errorMessage:null,
                forum_avatar_size: 45,
            }
        },

        created(){
            this.getComments();
        },

        methods:{
            createTopic(){
                const document = this.document;
                const document_id = document.document_id;
                const lang = this.locale.lang;

                forum.createTopic(document_id, lang)
                .then(response => {
                    const topic_id = response['data']['topic_id'];
                    const url = forum.url + '/t/' + document_id + '_' + lang + '/' + topic_id;
                    window.location = url;
                })
                .catch(error => {
                    if (error.response && error.response.status == 400) {
                        const topic_id = error.response['data']['errors'][0]['topic_id'];
                        if (topic_id !== undefined) {
                            this.locale.topic_id = topic_id;
                            this.getComments();
                        }
                    }
                })
            },

            getComments(){
                if(this.locale.topic_id){
                    forum.topic.get(this.locale.topic_id)
                    .then(response => {
                        this.topic = response.data

                        const data = this.topic.post_stream

                        if (data !== undefined) {
                            for (let post of data.posts) {
                                if (post['name'] != 'system') {
                                    post.avatar_template =  forum.url + '/' + post.avatar_template.replace('{size}', this.forum_avatar_size)
                                    post.cooked =  post.cooked.replace(/<a class="mention" href="/g, '<a class="mention" href="' + forum.url),
                                    this.comments.push(post);
                                }
                            }
                        }
                    })
                    .catch(error => {
                        this.errorMessage = error.message
                    })
                }
            }
        },
    }
</script>

<style lang="scss">

@import '@/assets/sass/variables.scss';

.discourse-comments{
    background: #fbfaf6 !important;
}

.discourse-post{
    border-top:6px solid $color-base-c2c;
    margin-bottom:1.5rem;
}

.discourse-post-avatar img{
    margin:15px 15px 15px 0;
    border-radius: 4px;
}

.discourse-post-header{
    background: #E4E4E4;
    padding: 4px 10px 4px;
}

.discourse-post-header-username{
    font-weight:bold;
}

.discourse-content{
    margin-top:0.5rem;
}

.discourse-content .emoji{
    width:1em;
    height:1em;
}
</style>
