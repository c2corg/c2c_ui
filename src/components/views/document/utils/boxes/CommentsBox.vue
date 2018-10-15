<template>
    <content-box v-if="enabled" class="discourse-comments">
        <h2 class="title is-2" v-translate>Comments</h2>

        <div v-if="document.disable_comments">
            <p v-translate>Comments are disabled.</p>
        </div>

        <div v-else-if="promise && promise.error" class="notification is-danger">
            <p>
                <span v-translate>Oups! Something went wrong with forum. Here is the message :</span>
                <br>
                {{ promise.error.message }}
            </p>
        </div>

        <div
            v-else-if="locale.topic_id === null || comments.length == 0"
            class="has-text-centered">
            <login-button v-if="!userIsLogged" v-translate>
                Log in to post the first comment
            </login-button>
            <button v-else class="button is-primary" @click="createTopic" v-translate>
                Post the first comment
            </button>
        </div>

        <div v-else>
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
                <login-button v-if="!userIsLogged" v-translate>
                    Log in to post a comment
                </login-button>
                <a v-else :href="discussionUrl" class="button is-primary" v-translate>
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
                promise:null,
                forum_avatar_size: 45,
            }
        },

        computed: {
            enabled(){
                return Boolean(this.locale.topic_id)
            },

            discussionUrl(){
                if(!this.topic)
                    return null

                return forum.url + '/t/' + this.topic.slug + '/' + this.locale.topic_id + '/' + this.topic.posts_count
            },

            userIsLogged(){
                return user.isLogged()
            },

            topic(){
                return this.promise.data
            },

            comments(){
                const result = []

                if(!this.enabled || !this.promise.data)
                    return result

                const data = this.promise.data.post_stream

                if (data !== undefined) {
                    for (let post of data.posts) {
                        if (post['name'] != 'system') {
                            post.avatar_template =  forum.url + '/' + post.avatar_template.replace('{size}', this.forum_avatar_size)
                            post.cooked =  post.cooked.replace(/<a class="mention" href="/g, '<a class="mention" href="' + forum.url),
                            result.push(post);
                        }
                    }
                }

                return result
            }

        },

        created(){
            this.getComments();
        },

        methods:{
            createTopic(){
                const document_id = this.document.document_id
                const lang = this.locale.lang

                forum.createTopic(document_id, lang)
                .then(response => {
                    const topic_id = response['data']['topic_id']
                    const url = forum.url + '/t/' + document_id + '_' + lang + '/' + topic_id
                    window.location = url
                })
                .catch(error => {
                    if (error.response && error.response.status == 400) {
                        const topic_id = error.response['data']['errors'][0]['topic_id']
                        if (topic_id !== undefined) {
                            this.locale.topic_id = topic_id
                            this.getComments()
                        }
                    }
                })
            },

            getComments(){
                if(this.enabled){
                    this.promise = forum.getTopic(this.locale.topic_id)
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
