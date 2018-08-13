<template>
    <span>
        <router-link :to="{ name: 'history', params: {type:documentType[document.type], id:document.document_id, lang:'fr'} }">
            <i class="fa fa-users"></i>
        </router-link>
        -
        <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.fr" target="_blank"
           v-if="cc == 'by-sa'">
            <i class="fab fa-creative-commons"></i> CC BY-SA 3.0
        </a>
        <a href="https://creativecommons.org/licenses/by-nc-nd/3.0/deed.fr" target="_blank"
           v-if="cc=='by-nc-nd'">
            <i class="fab fa-creative-commons"></i> CC BY-NC-ND 3.0
        </a>
    </span>
</template>

<script>
    import c2c from '@/js/c2c.js'

    export default {
        props: ['document', 'cc'],

        data(){
            return {documentType: c2c.documentType}
        }
    }
</script>
