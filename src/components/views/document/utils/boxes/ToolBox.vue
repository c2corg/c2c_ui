<template>
    <content-box class="no-print">
        <tool-box-button
            v-if="!isVersionView"
            @click="$refs.associationsEditor.show()"
            icon="link"
            :label="$gettext('Edit associations')" />

        <tool-box-button
            v-if="!isVersionView && hasMissingLangs"
            @click="$refs.translateWindow.show()"
            icon="edit"
            :label="$gettext('Translate into an other lang')" />

        <!-- Moderator zone -->
        <div v-if="$user.isModerator">

            <tool-box-button
                @click="lockDocumentAction"
                :icon="document.protected ? 'lock' : 'unlock'"
                :class="document.protected ? 'lock-button-red' : 'lock-button-green'"
                :label="document.protected ? $gettext('Unprotect document') : $gettext('Protect document')" />

            <tool-box-button
                @click="$refs.MergeDocumentWindow.show()"
                icon="object-group"
                :label="$gettext('Merge with other document')" />

            <tool-box-button
                v-if="!isVersionView && document.available_langs.length > 1"
                @click="$refs.DeleteLocaleWindow.show()"
                :icon="['fas','trash']"
                :label="$gettext('Delete this locale')" />

            <tool-box-button
                v-if="documentType=='profile'"
                @click="lockAccountAction"
                icon="user-lock"
                :class="{'lock-button-red':isAccountBlocked}"
                :label="isAccountBlocked ? $gettext('Unblock account') : $gettext('Block account')" />

            <tool-box-button
                @click="$refs.deleteDocumentWindow.show()"
                :icon="['fas','trash']"
                :label="$gettext('Delete this document')" />
        </div>

        <!-- Modal windows -->
        <associations-editor-window ref="associationsEditor" :document="document"/>
        <merge-document-window ref="MergeDocumentWindow" :document="document"/>
        <delete-document-window ref="deleteDocumentWindow" :document="document"/>
        <delete-locale-window ref="DeleteLocaleWindow" :document="document"/>
        <translate-window v-if="!isVersionView" ref="translateWindow" :document="document" :missing-langs="missingLangs"/>

    </content-box>
</template>

<script>
    import c2c from '@/apis/c2c'
    import constants from '@/js/constants'

    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    import ToolBoxButton from './ToolBoxButton'

    import AssociationsEditorWindow from '../windows/AssociationsEditorWindow'
    import DeleteDocumentWindow from '../windows/DeleteDocumentWindow'
    import DeleteLocaleWindow from '../windows/DeleteLocaleWindow'
    import MergeDocumentWindow from '../windows/MergeDocumentWindow'
    import TranslateWindow from '../windows/TranslateWindow'


    export default {
        components:{
            ToolBoxButton,

            AssociationsEditorWindow,
            DeleteLocaleWindow,
            DeleteDocumentWindow,
            MergeDocumentWindow,
            TranslateWindow,
        },

        mixins : [ requireDocumentProperty ],

        data(){
            return {
                isAccountBlocked:null,
            }
        },

        computed:{
            isVersionView(){
                return this.$route.name.endsWith("-version");
            },

            locale(){
                return this.document.currentLocale_
            },

            missingLangs(){
                var result = []

                for(let lang of constants.langs){
                    if(!this.document.available_langs.includes(lang))
                        result.push(lang)
                }

                return result
            },

            hasMissingLangs(){
                return this.missingLangs.length > 0
            },
        },

        created(){
            if(this.$user.isModerator && this.documentType=="profile")
                c2c.moderator.isAccountBlocked(this.document.document_id)
                .then(response => this.isAccountBlocked = response.data.blocked)
        },

        methods:{
            lockDocumentAction(){
                if(this.document.protected){
                    c2c.moderator.unprotectDocument(this.document.document_id).then(() => {
                        this.document.protected = false
                    })
                } else {
                    c2c.moderator.protectDocument(this.document.document_id).then(() => {
                        this.document.protected = true
                    })
                }
            },

            lockAccountAction(){
                if(this.isAccountBlocked){
                    c2c.moderator.unblockAccount(this.document.document_id).then(() => {
                        this.isAccountBlocked = false
                    })
                } else {
                    c2c.moderator.blockAccount(this.document.document_id).then(() => {
                        this.isAccountBlocked = true
                    })
                }
            }
        }
    }
</script>


<style scoped lang="scss">

@import "@/assets/sass/variables.scss";

.toolbox-button{
    cursor:pointer;

    span {
        color:$link;
    }
}

.lock-button-green{
    color:$green!important;
}

.lock-button-red{
    color:$red!important;
}
</style>
