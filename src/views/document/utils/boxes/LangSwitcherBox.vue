<template>
    <content-box v-if="document.available_langs && document.available_langs.length > 1">
        <span v-translate>View in other lang</span>
        :
        <span class="lang-switcher-box-list">
            <span v-for="lang of document.available_langs" :key="lang">
                <document-link :document="document" :lang="lang">
                    {{ lang }}
                </document-link>
            </span>
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

.lang-switcher-box-list span:not(:last-child)::after{
    content:" \2022 "; /* \2022 is bull */
}

</style>
