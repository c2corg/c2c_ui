<template>

    <router-link :to="{name:type, params:{id:document.document_id, lang:lang}}">
        <slot>
            <document-title v-if="document.type!='u'" :document="document"/>
            <span v-else>{{document.name}}</span>
        </slot>
    </router-link>

</template>

<script>
    import constants from '@/js/constants.js'

    export default {
        props: ['document', 'lang'],

        data(){
            return {
                type : null
            }
        },

        created(){
            this.type = constants.getDocumentType(this.document.type)
        }
    }

</script>
