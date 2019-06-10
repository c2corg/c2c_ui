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

      <p v-if="document.cooked.title">
        <fa-icon icon="tag" />
        <label>{{ document.cooked.title }}</label>
      </p>

      <markdown v-if="document.cooked.summary" class="is-italic" :content="document.cooked.summary" />
      <markdown v-if="document.cooked.description" :content="document.cooked.description" />

      <p v-if="document.image_type">
        <icon-creative-commons />
        <label>{{ $gettext(document.image_type) }}</label>
      </p>

      <ul>
        <li v-if="document.camera_name"> {{ document.camera_name }}</li>
        <li v-if="document.exposure_time" :title="$gettext('exposure_time')">1/{{ Math.floor(1/document.exposure_time) }}&nbsp;s</li>
        <li v-if="document.fnumber" :title="$gettext('fnumber')">f/{{ Math.round(document.fnumber * 10) / 10 }}</li>
        <li v-if="document.focal_length" :title="$gettext('focal_length')">{{ document.focal_length }}&nbsp;mm</li>
        <li v-if="document.iso_speed" :title="$gettext('iso_speed')">{{ document.iso_speed }}&nbsp;ISO</li>
        <li v-if="document.width && document.height" :title="$gettext('resolution')">
          {{ document.height }} x {{ document.width }}&nbsp;<span translate>pixels</span>
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
      }
    },

    methods: {
      show(documentId) {
        this.visible = true;
        this.promise = c2c.image.getCooked(documentId, this.$language.current);
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

    /* FIXME seems not to work */
    icon-creative-commons, fa-icon {
        margin-right:1rem;
    }
</style>
