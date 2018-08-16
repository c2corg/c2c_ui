<template>
    <div>
        <h2>Comments</h2>
        <div v-if="errorMessage" class="notification is-danger">
            <p>
                Oups! Something went wrong with forum. Here is the message : <br>
                {{errorMessage}}
            </p>
        </div>
        <div v-if="locale.topic_id === null">
            <div v-if="document.disable_comments">
                <p>Comments are disabled.</p>
            </div>
            <div v-else>
                <p v-if="!user.isLogged()">Log in to post the first comment</p>
                <button v-else class="button is-primary" @click="createTopic">
                    Post the first comment
                </button>
            </div>
        </div>

        <div v-if="comments.length > 0">
            <div v-for="post of comments" :key="post.id">
                <div>
                    <img :src="post.avatar_template">
                    <a :href="'https://forum.camptocamp.org/users/' + post.username" :title="post.username">
                        {{post.username}}
                    </a>
                    <span class="is-pulled-right">
                        {{post['created_at'] | timeAgo}}
                    </span>
                </div>
                <div v-html="post['cooked']"></div>
            </div>

            <div>
                <a :href="forum.url + '/t/' + topic.slug + '/' + locale.topic_id + '/' + topic.posts_count" class="button is-primary">
                    Continue the discussion
                </a>
            </div>
        </div>
    </div>
</template>

<script>
    import forum from '@/js/forum.js'
    import user from '@/js/user.js'

    export default {
        props:["document", "locale"],

        data(){
            return {
                forum,
                user,
                topic:null,
                comments:[],
                errorMessage:null
            }
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
                if(this.locale.topic_id && False){ //todo : once cors are allowed, test all that stuff
                    forum.topic.get(this.locale.topic_id)
                    .then(response => {
                        this.topic = response.data

                        const data = this.topic.post_stream

                        if (data !== undefined) {
                            for (let post of data.posts) {
                                if (post['name'] != 'system') {
                                    post.avatar_template =  forum.url + '/' + post.avatar_template.replace('{size}', '24')
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

        created(){
            this.getComments();
        }
    }
</script>
