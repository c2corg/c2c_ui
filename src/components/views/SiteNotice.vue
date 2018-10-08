<template>
    <div v-show="hasAnnouncement && !hidden" class="section" @click="showContent=!showContent">
        <div class="notification is-info">
            <button class="delete" @click="hidden=true"/>
            <div ref="header"/>
            <div v-show="showContent" ref="content"/>
        </div>
    </div>
</template>

<script>

    import forum from "@/js/forum"

    export default {
        data(){
            return {
                hasAnnouncement : false,
                html: null,
                hidden: false,
                showContent: false,
            }
        },

        created(){
            this.loadAnnouncement()
        },

        methods:{
            loadAnnouncement(){
                forum.readAnnouncement("fr").then(response => {
                    const data = response['data']
                    if (data['tags'].indexOf('visible') > -1) {
                        this.hasAnnouncement = true
                        this.html = data.post_stream.posts[0].cooked

                        // compute html, to split p
                        let content = document.createElement( 'div' );
                        content.innerHTML = this.html
                        let paragraphs = content.getElementsByTagName( 'p' )

                        this.$refs.header.appendChild(paragraphs[0])

                        for(let p of Array.from(paragraphs).slice(1))
                            this.$refs.content.appendChild(p)
                    }
                })
            }
        }
    }

</script>

<style scoped lang="scss">

.section{
    padding-bottom:0;
    cursor:pointer;
}

</style>
