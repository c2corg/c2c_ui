<template>
  <button class="button is-primary" :class="{ 'is-loading': isLoading }" @click="downloadOutings" v-translate>
    Download outings
  </button>
</template>

<script>
import c2c from '@/js/apis/c2c';
import utils from '@/js/utils';

export default {
  props: {
    profileId: {
      type: Number,
      required: true,
    },
  },

  data() {
    return {
      isLoading: false,
    };
  },

  methods: {
    downloadOutings() {
      this.isLoading = true;

      const extraKeys = new Map([
        ['title', this.$documentUtils.getDocumentTitle],
        [
          'url',
          (object) => {
            const href = this.$router.resolve({ name: 'outing', params: { id: object.document_id } }).href;
            return `https://www.camptocamp.org${href}`;
          },
        ],
      ]);

      c2c.outing
        .fullDownload({ u: this.profileId }, 1000)
        .then((outings) => {
          utils.downloadCsv(outings, 'outings.csv', extraKeys);
          this.isLoading = false;
        })
        .catch((error) => {
          this.isLoading = false;
          window.alert(error.response?.data?.errors?.[0]?.description);
        });
    },
  },
};
</script>
