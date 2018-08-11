<template>

    <router-link :to="{name:documentType[document.type], params:{id:document.document_id}}">
        <document-title v-if="document.type!='u'" :document="document"/>
        <span v-if="document.type=='u'">{{document.name}}</span>
    </router-link>

</template>

<script>
    import c2c from '@/js/c2c.js'

    export default {
        props: ['document'],

        data(){
            return {
                documentType: c2c.documentType
            }
        }
    }

</script>
