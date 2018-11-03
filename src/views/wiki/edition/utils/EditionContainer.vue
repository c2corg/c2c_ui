<template>
    <div v-if="document" class="section">
        <html-header title="Edit a document"/>
        <h1 class="title">
            <!-- TODO  v-translate -->
            Edit
            <document-title :document="document"/>
            in
            {{ $gettext(document.currentLocale_.lang) }}
        </h1>

        <div v-for="(error, i) of genericErrors" :key="i" class="has-text-danger has-text-weight-bold">
            {{ error.name }}
            :
            {{ error.description }}
        </div>

        <slot>
            ...
        </slot>

        <form-row label="" always-visible is-grouped>
            <div class="control">
                <button
                    class="button is-primary"
                    :class="{'is-loading':isLoading}"
                    @click="$emit('save', comment)"
                    v-translate>
                    Save
                </button>
            </div>
            <div v-show="mode=='edit'" class="control is-expanded">
                <input v-model="comment" type="text" class="input" :placeholder="$gettext('comment')">
            </div>
        </form-row>

    </div>
</template>

<script>

    import FormRow from './FormRow'

    export default {

        components : { FormRow },

        props : {
            document:{
                type : Object,
                default: null,
            },
            genericErrors:{
                type: Array,
                required: true,
            },
            isLoading:{
                type:Boolean,
                required:true,
            },
            mode:{
                type: String,
                required: true,
            }
        },

        data() {
            return {
                comment:"",
            }
        },
    }
</script>
