import constants from '@/js/constants'

// we need to use a VM, because we need access to Vue.$user.lang

export default function install(Vue){

    Vue.prototype.$documentUtils = new Vue({
        methods:{
            getDocumentTitle(document, lang){
                if(document.type=="u" || !document.type){
                    return document.name
                }

                var locale = this.$documentUtils.getLocaleSmart(document, lang)

                if (locale.title_prefix)
                    return locale.title_prefix + " : " + locale.title

                return locale.title
            },

            getLocaleStupid(document, lang){
                if(!document.locales)
                    return null

                for(let result of document.locales){
                    if (result.lang == lang){
                        return result
                    }
                }

                return null
            },

            getLocaleSmart(document, lang){

                //first of all try to search asked lang
                var result = lang ? this.$documentUtils.getLocaleStupid(document, lang) : null

                if(result)
                    return result

                //else, search user lang
                result = this.$documentUtils.getLocaleStupid(document, this.$user.lang)
                if(result)
                    return result

                //else try langs by order
                for(let lang of constants.langs){
                    result = this.$documentUtils.getLocaleStupid(document, lang)
                    if(result)
                        return result
                }

                //should never happen
                return null
            }
        }
    })
}
