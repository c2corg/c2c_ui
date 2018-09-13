<template>
    <span>{{ title }}</span>
</template>

<script>
    import user from '@/js/user.js'

    export default {
        props: {
            document: Object
        },

        computed:{
            title(){
                if(this.document.type=="u" || !this.document.type){
                    return this.document.name
                }

                var locale = user.getLocaleSmart(this.document, this.$route.params.lang)

                if (locale.title_prefix)
                    return locale.title_prefix + " : " + locale.title

                return locale.title
            }
        }
    }
</script>
