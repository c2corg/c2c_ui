<template>
    <span>
        <a :href="'https://www.camptocamp.org/' + documentType[document.type]  + 's/' + document.document_id"
           target="_blank">
            <i class="fas fa-external-link-alt"></i>
        </a>
        -
        <a :href="'https://www.camptocamp.org/' + documentType[document.type]  + 's/history/' + document.document_id + '/fr'"
           target="_blank">
            <i class="fa fa-users"></i>
        </a>
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
