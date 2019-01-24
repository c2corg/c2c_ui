<template>
    <!-- We alawys display this link, even when user is not logged
    In this case, editions vues will redirect user to /auth -->
    <router-link :to="{name:documentType + '-add', params:{lang:$language.current}, query:query}">
        <slot>
            {{ $documentUtils.getCreationTitle(documentType) | uppercaseFirstLetter }}
        </slot>
    </router-link>
</template>

<script>
    import { requireDocumentTypeProperty } from '@/js/properties-mixins'

    export default{
        mixins: [ requireDocumentTypeProperty ],

        props: {
            query: {
                type: Object,
                default: null
            }
        }
    }
</script>
