<template>
  <div class="image-info has-text-light" v-if="visible">
    <h3 class="title is-3 has-text-light" v-translate>Infos</h3>

    <div v-if="document">
      <p v-if="document.date_time">
        <fa-icon icon="calendar" />
        <label>
          {{ $dateUtils.toLocalizedString(document.date_time, 'PPpp') }}
        </label>
      </p>

      <p v-if="document.cooked.title">
        <fa-icon icon="tag" />
        <label>
          {{ document.cooked.title }}
        </label>
      </p>

      <markdown v-if="document.cooked.summary" class="is-italic" :content="document.cooked.summary" />
      <markdown v-if="document.cooked.description" :content="document.cooked.description" />

      <p v-if="document.image_type">
        <icon-creative-commons />
        <label>
          {{ $gettext(document.image_type) }}
        </label>
      </p>

      <h4 class="title is-4 has-text-light" v-translate>Settings</h4>

      <ul>
        <li v-if="document.camera_name">{{ document.camera_name }}</li>
        <li v-if="document.exposure_time" :title="$gettext('exposure_time')">{{ document.exposure_time }}s</li>
        <li v-if="document.fnumber" :title="$gettext('fnumber')">f/{{ document.fnumber }}</li>
        <li v-if="document.focal_length" :title="$gettext('focal_length')">{{ document.focal_length }}&nbsp;mm</li>
        <li v-if="document.iso_speed" :title="$gettext('iso_speed')">{{ document.iso_speed }} ISO</li>
        <li v-if="document.width && document.height" :title="$gettext('resolution')">
          {{ document.height }} x {{ document.width }} <span v-translate>pixels</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import c2c from '@/js/apis/c2c';

export default {
  data() {
    return {
      promise: {},
      visible: false,
    };
  },

  computed: {
    document() {
      return this.promise.data ? this.promise.data : null;
    },
  },

  methods: {
    show(documentId) {
      this.visible = true;
      this.promise = c2c.image.getCooked(documentId, this.$language.getApiLang(this.$language.current));
    },

    hide() {
      this.visible = false;
    },

    toggle(documentId) {
      if (this.visible) {
        this.hide();
      } else {
        this.show(documentId);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.image-info {
  background: rgba(0, 0, 0, 0.7);
  padding: 1rem;
}
</style>
