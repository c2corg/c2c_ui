<template>
  <modal-window ref="modalWindow">
    <div slot="header" class="has-text-centered">
      <span>
        {{ type }}
      </span>
      <span>
        {{ data.properties.label }}
      </span>
    </div>
    <table>
      <tbody>
        <tr v-if="protectionStatus">
          <td v-translate>Protection status</td>
          <td>{{ protectionStatus }}</td>
        </tr>
        <tr v-if="data.properties.schutzzeit">
          <td v-translate>Period of protection</td>
          <td>{{ data.properties.schutzzeit }}</td>
        </tr>
        <tr v-if="dispositions.length">
          <td v-translate>Dispositions</td>
          <td>{{ dispositions }}</td>
        </tr>
        <tr v-if="additionalInformation.length">
          <td v-translate>Additional information</td>
          <td>{{ additionalInformation }}</td>
        </tr>
      </tbody>
    </table>
  </modal-window>
</template>

<script>
import utils from '@/js/utils';

export default {
  props: {
    data: {
      type: Object,
      required: true,
    },
  },
  computed: {
    type() {
      switch (this.data.layerBodId) {
        case 'ch.bafu.wrz-wildruhezonen_portal':
          return this.$gettext('Protection area:');
        case 'ch.bafu.wrz-jagdbanngebiete_select':
          return this.$gettext('Fauna protection site:');
        default:
          return this.$gettext('Sensitive area:');
      }
    },
    dispositions() {
      let lang = this.$language.current;
      if (!['fr', 'de', 'it'].includes(lang)) {
        lang = 'fr';
      }
      const result = this.data.properties[`best_${lang}`] ?? '';
      return utils.decodeHtmlEntities(result);
    },
    additionalInformation() {
      const result = this.data.properties.zusatzinformation ?? '';
      return utils.decodeHtmlEntities(result);
    },
    protectionStatus() {
      let lang = this.$language.current;
      if (!['fr', 'de', 'it'].includes(lang)) {
        lang = 'fr';
      }

      return utils.decodeHtmlEntities(this.data.properties[`schutzs_${lang}`] ?? '');
    },
  },
  methods: {
    show() {
      this.$refs.modalWindow.show();
    },
  },
};
</script>
