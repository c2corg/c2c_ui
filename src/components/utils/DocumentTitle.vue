<template>
    <span>
        {{getTitle()}}
    </span>
</template>

<script>
    export default {
        props: ['document'],

        data(){
            return {
                getTitle : function(){
                    if(this.document.type=="u"){
                        return this.document.name
                    }

                    var locale = this.document.locales[0]

                    this.document.locales.forEach(function(iLocale){
                        if (locale.lang==="fr")
                            locale = iLocale;
                    })

                    if (locale.title_prefix)
                        return locale.title_prefix + " : " + locale.title

                    return locale.title
                }
            }
        }
    }
</script>
