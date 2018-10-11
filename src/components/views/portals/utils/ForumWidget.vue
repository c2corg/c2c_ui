<template>
    <div :class="{wide:wide}">
        <loading-notification :promise="promise" />
        <div v-if="topics" >
            <a
                class="columns is-paddingless is-marginless forum-row"
                :class="{'is-gapless':!wide}"
                v-for="topic of topics.topics.slice(0, messageCount<0 ? 9999 : messageCount)"
                :key="topic.id"
                v-if="topic.category_id != 29"
                :href="forum.url + '/t/' + topic.slug + '/' + topic.id + '/' + topic.highest_post_number"
                target="_blank">
                <div class="column is-narrow">
                    <img
                        :src="forum.url + topic.last_poster_user.avatar_template.replace('{size}',imgSize)"
                        :style="'width:' + imgSize + 'px'">
                </div>
                <div class="column">
                    {{ topic.title }}
                </div>
            </a>
        </div>
    </div>
</template>

<script>
    import forum from '@/js/forum.js'

    export default {

        props: {
            wide: {
                type:Boolean,
                default: false,
            },
            messageCount: {
                type:Number,
                default: -1,
            }
        },
        data() {
            return {
                promise:null,
                forum,
            }
        },

        computed: {
            topics(){
                return this.promise.data ? this.promise.data.topic_list : null
            },
            imgSize(){
                return this.wide ? 24 : 16
            }
        },

        created() {
            this.promise = forum.getLatest()
        }
    }
</script>

<style scoped lang="scss">

@import '@/assets/sass/variables.scss';

a{
    display:block;
}

.wide{

    .forum-row{
        border-bottom: 1px solid #EEE;
        font-weight:bold;

        a {
            color:red;
        }

        img {
            border-radius: 50%;
        }
    }

    .forum-row:hover{
        background: $hover-background;
    }
}
</style>
