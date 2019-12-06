<template>
  <modal-window ref="modalWindow">
    <div slot="header" class="has-text-centered">
      <span v-translate>
        Sensitive area:
      </span>
      <span>
        {{ data.title }}
      </span>
    </div>

    <p v-if="data.period">
      <span v-translate>sensitive_months:</span>
      <span>{{ months.join(", ") }}</span>
    </p>

    <!-- content formatting done with "he" html entities decoder -->
    <p v-for="descPar of descriptionParagraphs">{{ descPar }}</p>
    <a :href="data.infoUrl" target="_blank" rel="noopener" v-translate>More info</a> |
    <a :href="data.kmlUrl" target="_blank" rel="noopener">KML</a>
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
      descriptionParagraphs() {
        let result = this.data.description || '';

        // keep line breaks for better readability
        result = result.replace(/<br ?\/?>/g, "%%MYNL%%");
        // decode html entities, no dynamic html code
        result = he.decode(result);
        // discard all remaining html tags
        result = result.replace(/<[^>]*>/g, "");
        // restore initial line breaks
        result = result.split("%%MYNL%%");
        return result;
      },

      months() {
        const result = [];

        for (const month in this.data.period) {
          if (this.data.period[month]) {
            result.push(this.$moment.month(parseInt(month, 10)));
          }
        }

        return result;
      }
    },

    methods: {
      show() {
        this.$refs.modalWindow.show();
      }
    }
  };

</script>
