<template>
  <div class="box no-print">

    <associated-documents :document="document" />

    <div class="has-text-centered" v-if="isNormalView && available_langs.length>0">
      <span v-translate>View in other lang</span>
      <br>
      <span class="lang-switcher-box-list">
        <span v-for="lang of available_langs" :key="lang">
          <document-link :document="document" :lang="lang">
            {{ $gettext(lang, 'langs') }}
          </document-link>
        </span>
      </span>
      <hr>
    </div>

    <tool-box-button
      v-if="documentType==='profile'"
      :to="{ name: 'outings', query: {u:document.document_id} }"
      :label="$gettext('outings')"
      icon="edit">
      <icon-outing slot="icon" />
    </tool-box-button>

    <tool-box-button
      v-if="documentType==='profile'"
      :to="{ name: 'whatsnew', query: {u:document.document_id} }"
      :label="$gettext('Contributions')"
      icon="edit" />

    <tool-box-button
      v-if="document.geometry && document.geometry.geom && documentType !== 'area'"
      :to="linkToClosestDocuments"
      :label="$gettext('See other documents nearby')"
      icon="compass" />

    <tool-box-button
      v-if="documentType!='profile' || $user.isModerator || document.document_id === $user.id"
      :to="{name:documentType + '-history', params:{id:document.document_id, lang:document.cooked.lang}}"
      :label="$gettext('History')"
      icon="history" />

    <tool-box-button
      v-if="isEditable && showAssociationEditor"
      @click="$refs.associationsWindow.show()"
      icon="link"
      :label="$gettext('Edit associations')" />

    <tool-box-button
      v-if="isEditable && hasMissingLangs"
      @click="$refs.translateWindow.show()"
      icon="globe"
      :label="$gettext('Translate into an other lang')" />

    <tool-box-button
      :href="`mailto:${$options.reportingIssueMail}?subject=${reportingSubject}&body=${reportingBody}`"
      :icon="['fas', 'exclamation-circle']"
      icon-class="has-text-danger"
      :label="$gettext('Report an issue')" />

    <hr>

    <!-- Moderator zone -->
    <template v-if="isEditable && $user.isModerator">
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
        v-if="documentType === 'profile'"
        @click="lockAccountAction"
        icon="user-lock"
        :class="{'lock-button-red':isAccountBlocked}"
        :label="isAccountBlocked ? $gettext('Unblock account') : $gettext('Block account')" />
    </template>

    <template v-if="isDeletable">
      <tool-box-button
        v-if="document.available_langs.length > 1"
        @click="$refs.DeleteLocaleWindow.show()"
        :icon="['fas','trash']"
        :label="$gettext('Delete this locale')" />

      <tool-box-button
        @click="$refs.deleteDocumentWindow.show()"
        :icon="['fas','trash']"
        :label="$gettext('Delete this document')" />
    </template>

    <hr v-if="isDeletable || (isEditable && $user.isModerator)">

    <license-box :document="document" />

    <!-- Modal windows -->
    <div v-if="isEditable">
      <merge-document-window ref="MergeDocumentWindow" :document="document" />
      <delete-document-window ref="deleteDocumentWindow" :document="document" />
      <delete-locale-window ref="DeleteLocaleWindow" :document="document" :locale-lang="document.cooked.lang" />
      <translate-window ref="translateWindow" :document="document" :missing-langs="missingLangs" />
      <associations-window ref="associationsWindow" :document="document" />
    </div>

  </div>
</template>

<script>
  import ol from '@/js/libs/ol';

  import c2c from '@/js/apis/c2c';
  import constants from '@/js/constants';

  import { requireDocumentProperty } from '@/js/properties-mixins';
  import isEditableMixin from '../is-editable-mixin';
  import viewModeMixin from '../view-mode-mixin';

  import ToolBoxButton from './ToolBoxButton';
  import LicenseBox from './LicenseBox';
  import AssociatedDocuments from './AssociatedDocuments';

  import AssociationsWindow from '@/components/association-editor/AssociationsWindow';
  import DeleteDocumentWindow from '../windows/DeleteDocumentWindow';
  import DeleteLocaleWindow from '../windows/DeleteLocaleWindow';
  import MergeDocumentWindow from '../windows/MergeDocumentWindow';
  import TranslateWindow from '../windows/TranslateWindow';

  const GeoJSON = new ol.format.GeoJSON();

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
      };
    },

    reportingIssueMail: 'topo-fr@camptocamp.org',

    computed: {
      reportingSubject() {
        return this.$gettext('Issue report');
      },

      reportingBody() {
        return encodeURIComponent(this.$gettext('Describe here your issue') + '\r\n\r\n----\r\n\r\n' + window.location.href);
      },

      available_langs() {
        return this.document.available_langs.filter((lang) => this.$route.params.lang !== lang);
      },

      showAssociationEditor() {
        return !['area'].includes(this.documentType);
      },

      missingLangs() {
        const result = [];

        for (const lang of constants.langs) {
          if (!this.document.available_langs.includes(lang)) {
            result.push(lang);
          }
        }

        return result;
      },

      hasMissingLangs() {
        return this.missingLangs.length > 0;
      },

      linkToClosestDocuments() {
        const result = {
          name: this.documentType + 's',
          query: {
            wtyp: this.documentType === 'waypoint' ? this.document.waypoint_type : undefined
          }
        };

        if (this.document.geometry && this.document.geometry.geom) {
          const point = GeoJSON.readFeatures(this.document.geometry.geom)[0];
          const extent = ol.extent.buffer(point.getGeometry().getExtent(), 10000);

          result.query.bbox = extent.map(Math.floor).join(',');
        }

        return result;
      }
    },

    created() {
      if (this.$user.isModerator && this.documentType === 'profile') {
        c2c.moderator.isAccountBlocked(this.document.document_id)
          .then((response) => {
            this.isAccountBlocked = response.data.blocked;
        });
      }
    },

    methods: {
      lockDocumentAction() {
        if (this.document.protected) {
          c2c.moderator.unprotectDocument(this.document.document_id).then(() => {
            this.document.protected = false;
          });
        } else {
          c2c.moderator.protectDocument(this.document.document_id).then(() => {
            this.document.protected = true;
          });
        }
      },

      lockAccountAction() {
        if (this.isAccountBlocked) {
          c2c.moderator.unblockAccount(this.document.document_id).then(() => {
            this.isAccountBlocked = false;
          });
        } else {
          c2c.moderator.blockAccount(this.document.document_id).then(() => {
            this.isAccountBlocked = true;
          });
        }
      }
    }
  };
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
