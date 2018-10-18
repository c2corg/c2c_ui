<template>
    <div v-if="document.currentLocale_[field.name] && field.isVisibleFor(document)">
        <h2 v-if="field.name !='summary' && !hideTitle" class="title is-2" >
            {{ $gettext(field.name) }}
        </h2>
        <markdown :class="{'is-italic':field.name==='summary'}" :content="document.currentLocale_[field.name]"/>
    </div>
</template>


<script>
    import { requireDocumentProperty, requireFieldProperty} from '@/js/propertiesMixins.js'

    export default {

        mixins : [ requireDocumentProperty, requireFieldProperty ],

        props: {
            hideTitle:{
                type:Boolean,
                default:false,
            }
        }
    }
</script>
