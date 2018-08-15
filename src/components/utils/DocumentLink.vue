<template>

    <router-link :to="{name:documentType[document.type], params:{id:document.document_id}}">
        <document-title v-if="document.type!='u'" :document="document"/>
        <span v-if="document.type=='u'">{{document.name}}</span>
    </router-link>

</template>

<script>
    import constants from '@/js/constants.js'

    export default {
        props: ['document'],

        data(){
            return {
                documentType: constants.documentType
            }
        }
    }

</script>
