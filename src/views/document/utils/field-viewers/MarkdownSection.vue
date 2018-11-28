<template>
    <div v-if="document.currentLocale_[field.name] && field.isVisibleFor(document)">
        <h3 v-if="field.name !='summary' && !hideTitle" class="title is-3" >
            {{ $gettext(field.name) }}
        </h3>
        <markdown :class="{'is-italic':field.name==='summary'}" :content="document.currentLocale_[field.name]"/>
    </div>
</template>


<script>
    import { requireDocumentProperty, requireFieldProperty} from '@/js/properties-mixins'

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
