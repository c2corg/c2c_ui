<template>
  <div class="card" :class="{ 'is-highlighted': highlighted }">
    <document-link :document="document" :target="target">
      <span :title="$gettext('User avatar')">
        <img
          v-if="!useDefaultAvatarIcon"
          class="avatar"
          alt="Avatar"
          @error="useDefaultAvatarIcon = true"
          :src="$options.forumAvatarUrl + item.user.forum_username + '/36/1_1.png'"
          loading="lazy"
        />
        <fa-icon v-else icon="user" class="is-size-3 has-text-grey" />
      </span>
      <marker-document-type :document-type="documentType" class="is-pulled-left is-size-3" />

      <document-title :document="item.document" class="row has-text-weight-bold is-ellipsed" />

      <span v-if="documentType === 'outing'">{{ dates }}</span>
      <!-- <span v-if="item.document.areas && item.document.areas.length" class="row is-ellipsed" >
        <card-region-item :document="item.document" />
      </span> -->

      <span class="is-pulled-right">
        <span>
          <card-activities-item v-if="item.document.activities" :activities="item.document.activities" />
        </span>
        <span>
          <marker-soft-mobility v-if="documentType === 'outing' && item.document.public_transport" />
          <marker-image-count :image-count="item.document.img_count" />
          <marker-gps-trace v-if="item.document.geometry && item.document.geometry.has_geom_detail" />
          <marker-condition v-if="documentType === 'outing'" :condition="item.document.condition_rating" />
          <marker-quality :quality="item.document.quality" />
        </span>
      </span>
    </document-link>
  </div>
</template>

<script>
import { cardMixin } from './utils/mixins';

import forum from '@/js/apis/forum';

export default {
  components: {},

  filters: {
    max300chars: (value) => (value.length > 300 ? value.substring(0, 300) + '…' : value),
  },

  mixins: [cardMixin],

  props: {
    item: {
      type: Object,
      required: true,
    },
    highlighted: {
      type: Boolean,
      default: false,
    },
    target: {
      type: String,
      default: undefined,
    },
  },

  data() {
    return {
      actionLine: null,
      images: [],
      useDefaultAvatarIcon: false,
    };
  },

  computed: {
    document() {
      return this.item.document;
    },
    documentType() {
      return this.$documentUtils.getDocumentType(this.document['type']);
    },
    locale() {
      return this.$documentUtils.getLocaleSmart(this.item.document);
    },
  },

  forumAvatarUrl: forum.url + '/user_avatar/' + forum.url.replace('https://', '') + '/',

  created() {
    this.actionLine = {
      'added_photos article': this.$gettext('has added images to article'),
      'added_photos book': this.$gettext('has added images to book'),
      'added_photos area': this.$gettext('has added images to area'),
      'added_photos outing': this.$gettext('has added images to outing'),
      'added_photos route': this.$gettext('has added images to route'),
      'added_photos waypoint': this.$gettext('has added images to waypoint'),
      'added_photos xreport': this.$gettext('has added images to xreport'),
      'created article': this.$gettext('has created a new article'),
      'created book': this.$gettext('has created a new book'),
      'created image': this.$gettext('has created a new image'),
      'created outing': this.$gettext('has created a new outing'),
      'created route': this.$gettext('has created a new route'),
      'created waypoint': this.$gettext('has created a new waypoint'),
      'created xreport': this.$gettext('has created a new xreport'),
      'updated area': this.$gettext('has updated the area'),
      'updated article': this.$gettext('has updated the article'),
      'updated book': this.$gettext('has updated the book'),
      'updated image': this.$gettext('has updated the image'),
      'updated outing': this.$gettext('has updated the outing'),
      'updated route': this.$gettext('has updated the route'),
      'updated waypoint': this.$gettext('has updated the waypoint'),
      'updated xreport': this.$gettext('has updated the xreport'),
    }[[this.item['change_type'], this.documentType].join(' ')];

    this.dates = this.$documentUtils.getShortOutingDatesLocalized(this.item['document']);

    if (this.item.image1) {
      this.images.push(this.item.image1);
    }

    if (this.item.image2) {
      this.images.push(this.item.image2);
    }

    if (this.item.image3) {
      this.images.push(this.item.image3);
    }
  },
};
</script>

<style scoped lang="scss">
.avatar {
  border-radius: 50%;
  width: 24px;
  height: 24px;
  vertical-align: middle;
  margin-right: 0.5rem;
  margin-left: 0.5rem;
}

.card {
  transition: 0.1s;
  border: $card-border;
  background: white;
  max-height: 3em;
}

a {
  color: #363636 !important;
}

.card:hover,
.is-highlighted {
  transition: 0.2s;
  box-shadow: $card-hover-shadow;
  background: $hover-background;
}

.row {
  display: inline-block;
  max-width: 75%;
}
</style>
