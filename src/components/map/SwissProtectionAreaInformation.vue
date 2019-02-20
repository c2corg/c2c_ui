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
        <tr v-if="dispositions.length > 0">
          <td v-translate>Dispositions</td>
          <td>{{ dispositions }}</td>
        </tr>
        <tr v-if="additionalInformation.length > 0">
          <td v-translate>Additional information</td>
          <td>{{ additionalInformation }}</td>
        </tr>
      </tbody>
    </table>
  </modal-window>
</template>

<script>
  import he from 'he';
  export default {
    props: {
      data: {
        type: Object,
        required: true
      }
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
        if (lang !== 'fr' && lang !== 'de' && lang !== 'it') {
          lang = 'fr';
        }
        const result = this.data.properties[`best_${lang}`] || '';
        return he.decode(result, { strict: true });
      },
      additionalInformation() {
        const result = this.data.properties.zusatzinformation || '';
        return he.decode(result, { strict: true });
      },
      protectionStatus() {
        let lang = this.$language.current;
        if (lang !== 'fr' && lang !== 'de' && lang !== 'it') {
          lang = 'fr';
        }
        return he.decode(this.data.properties[`schutzs_${lang}`] || '', { strict: true });
      }
    },
    methods: {
      show() {
        this.$refs.modalWindow.show();
      }
    }
  };
</script>
