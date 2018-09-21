<template>
    <content-box v-if="document.available_langs && document.available_langs.length>1" class="lang-switcher-box">
        View in other language :
        <span v-for="lang of document.available_langs" :key="lang">
            <document-link :document="document" :lang="lang">
                {{ lang }}
            </document-link>
        </span>
    </content-box>
</template>

<script>
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [ requireDocumentProperty ],
    }
</script>


<style scoped>

.lang-switcher-box span:not(:last-child)::after{
    content:" \2022 "; /* \2022 is bull */
}

</style>
