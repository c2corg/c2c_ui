<template>
    <div class="box no-print">

        <associated-documents :document="document" />

        <div class="has-text-centered" v-if="isNormalView && document.available_langs.length>1">
            <span v-translate>View in other lang</span>
            <br>
            <span class="lang-switcher-box-list">
                <span v-for="lang of document.available_langs" :key="lang" v-if="lang !== $route.params.lang">
                    <document-link :document="document" :lang="lang">
                        {{ $gettext(lang, 'langs') }}
                    </document-link>
                </span>
            </span>
            <hr>
        </div>

        <div v-if="isEditable">
            <tool-box-button
                @click="$refs.associationsWindow.show()"
                icon="link"
                :label="$gettext('Edit associations')" />

            <tool-box-button
                v-if="hasMissingLangs"
                @click="$refs.translateWindow.show()"
                icon="edit"
                :label="$gettext('Translate into an other lang')" />
            <hr>
        </div>

        <!-- Moderator zone -->
        <div v-if="$user.isModerator && isEditable">

            <tool-box-button
                v-if="documentType !== 'profile'"
                @click="lockDocumentAction"
                :icon="document.protected ? 'lock' : 'unlock'"
                :class="document.protected ? 'lock-button-red' : 'lock-button-green'"
                :label="document.protected ? $gettext('Unprotect document') : $gettext('Protect document')" />

            <tool-box-button
                v-if="documentType !== 'profile'"
                @click="$refs.MergeDocumentWindow.show()"
                icon="object-group"
                :label="$gettext('Merge with other document')" />

            <tool-box-button
                v-if="document.available_langs.length > 1 && documentType !== 'profile'"
                @click="$refs.DeleteLocaleWindow.show()"
                :icon="['fas','trash']"
                :label="$gettext('Delete this locale')" />

            <tool-box-button
                v-if="documentType === 'profile'"
                @click="lockAccountAction"
                icon="user-lock"
                :class="{'lock-button-red':isAccountBlocked}"
                :label="isAccountBlocked ? $gettext('Unblock account') : $gettext('Block account')" />

            <tool-box-button
                v-if="documentType !== 'profile'"
                @click="$refs.deleteDocumentWindow.show()"
                :icon="['fas','trash']"
                :label="$gettext('Delete this document')" />

            <hr>
        </div>

        <license-box :document="document" />

        <!-- Modal windows -->
        <div v-if="isEditable">
            <merge-document-window ref="MergeDocumentWindow" :document="document"/>
            <delete-document-window ref="deleteDocumentWindow" :document="document"/>
            <delete-locale-window ref="DeleteLocaleWindow" :document="document" :locale-lang="document.cooked.lang"/>
            <translate-window ref="translateWindow" :document="document" :missing-langs="missingLangs"/>
            <associations-window ref="associationsWindow" :document="document"/>
        </div>

    </div>
</template>

<script>
    import c2c from '@/js/apis/c2c'
    import constants from '@/js/constants'

    import { requireDocumentProperty } from '@/js/properties-mixins'
    import isEditableMixin from '../is-editable-mixin'
    import viewModeMixin from '../view-mode-mixin'

    import ToolBoxButton from './ToolBoxButton'
    import LicenseBox from './LicenseBox'
    import AssociatedDocuments from './AssociatedDocuments'

    import AssociationsWindow from '../windows/AssociationsWindow'
    import DeleteDocumentWindow from '../windows/DeleteDocumentWindow'
    import DeleteLocaleWindow from '../windows/DeleteLocaleWindow'
    import MergeDocumentWindow from '../windows/MergeDocumentWindow'
    import TranslateWindow from '../windows/TranslateWindow'

    export default {
        components: {
            ToolBoxButton,
            LicenseBox,
            AssociatedDocuments,

            AssociationsWindow,
            DeleteLocaleWindow,
            DeleteDocumentWindow,
            MergeDocumentWindow,
            TranslateWindow
        },

        mixins: [ requireDocumentProperty, viewModeMixin, isEditableMixin ],

        data() {
            return {
                isAccountBlocked: null
            }
        },

        computed: {
            // TODO : useless ? remove !
            // locale(){
            //     return this.document.cooked
            // },

            missingLangs() {
                var result = []

                for (let lang of constants.langs) {
                    if (!this.document.available_langs.includes(lang)) {
                        result.push(lang)
                    }
                }

                return result
            },

            hasMissingLangs() {
                return this.missingLangs.length > 0
            }
        },

        created() {
            if (this.$user.isModerator && this.documentType === 'profile') {
                c2c.moderator.isAccountBlocked(this.document.document_id)
                    .then((response) => {
                        this.isAccountBlocked = response.data.blocked
                    })
            }
        },

        methods: {
            lockDocumentAction() {
                if (this.document.protected) {
                    c2c.moderator.unprotectDocument(this.document.document_id).then(() => {
                        this.document.protected = false
                    })
                } else {
                    c2c.moderator.protectDocument(this.document.document_id).then(() => {
                        this.document.protected = true
                    })
                }
            },

            lockAccountAction() {
                if (this.isAccountBlocked) {
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

    .lang-switcher-box-list span:not(:last-child)::after{
        content:" \2022 "; /* \2022 is bull */
    }

</style>
