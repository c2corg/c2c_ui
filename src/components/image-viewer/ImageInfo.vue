<template>
  <div class="image-info has-text-light" v-if="visible">
    <h3 class="title is-3 has-text-light" v-translate>
      Infos
    </h3>

    <div v-if="document">
      <p>
        <fa-icon icon="calendar" />
        <label>{{ document.date_time }}</label>
      </p>

      <p v-if="document.locales[0].title">
        <fa-icon icon="tag" />
        <label>{{ document.locales[0].title }}</label>
      </p>

      <p v-if="locale.description"> {{ locale.description }}</p>

      <p v-if="document.image_type">
        <icon-creative-commons />
        <label>{{ $gettext(document.image_type) }}</label>
      </p>

      <h4 class="title is-4 has-text-light" v-translate>
        Settings
      </h4>

      <ul>
        <li v-if="document.camera_name"> {{ document.camera_name }}</li>
        <li v-if="document.exposure_time" :title="$gettext('exposure_time')">{{ document.exposure_time }}s</li>
        <li v-if="document.fnumber" :title="$gettext('fnumber')">f/{{ document.fnumber }}</li>
        <li v-if="document.focal_length" :title="$gettext('focal_length')">{{ document.focal_length }}&nbsp;mm</li>
        <li v-if="document.iso_speed" :title="$gettext('iso_speed')">{{ document.iso_speed }} ISO</li>
        <li v-if="document.width && document.height" :title="$gettext('resolution')">
          {{ document.height }} x {{ document.width }} <span translate>pixels</span>
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
        visible: false
      };
    },

    computed: {
      document() {
        return this.promise.data ? this.promise.data : null;
      },

      locale() {
        return this.document ? this.$documentUtils.getLocaleSmart(this.document) : null;
      }
    },

    methods: {
      show(documentId) {
        this.visible = true;
        this.promise = c2c.image.get(documentId);
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
      }
    }
  };

</script>

<style scoped lang="scss">

    .image-info{
        background: rgba(0,0,0,0.7);
        padding:1rem;
    }
</style>
