<template>
    <span>{{getTitle()}}</span>
</template>

<script>
    import user from '@/js/user.js'

    export default {
        props: ['document'],

        methods:{
            getTitle(){
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
