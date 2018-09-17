<template>
    <content-box class="lang-switcher-box" v-if="document.available_langs.length>1">
        View in other language :
        <span v-for="lang of document.available_langs" :key="lang">
            <document-link :document="document" :lang="lang">
                {{ lang }}
            </document-link>
        </span>
    </content-box>
</template>

<script>
    import { props } from '@/js/properties.js'

    export default {
        props : props.requiredDocument,
    }
</script>


<style scoped>

.lang-switcher-box span:not(:last-child)::after{
    content:" \2022 "; /* \2022 is bull */
}

</style>
