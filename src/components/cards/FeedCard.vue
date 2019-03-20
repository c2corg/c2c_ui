<template>
  <card-container :document="document" class="feed-card">
    <card-title>
      <img class="avatar" :src="$options.forumAvatarUrl + item.user.forum_username + '/36/1_1.png'">

      <span>
        <document-title :document="item.user" />
        <span class="has-text-weight-normal">&nbsp;{{ actionLine }}</span>
      </span>

      <marker-document-type :document-type="documentType" class="is-pulled-right is-size-3" />
    </card-title>

    <card-row>
      <document-title :document="item.document" class="is-ellipsed has-text-weight-bold" />
      <span v-if="documentType=='outing'" class="is-nowrap has-mobile-left-margin">{{ dates }}</span>
    </card-row>

    <card-row v-if="locale && locale.summary">
      <p class="is-ellipsed is-mobile-max-3-lines-height">{{ locale.summary | stripMarkdown | max300chars }}</p>
    </card-row>

    <card-row v-if="images.length!=0">
      <gallery :images="images" />
    </card-row>

    <card-row v-if="documentType!='article' && documentType!='book'">
      <span v-if="documentType=='outing' || documentType=='route'">
        <icon-ratings class="card-icon" />
        <outing-rating v-if="documentType=='outing'" :document="item.document" />
        <route-rating v-else-if="documentType=='route'" :document="item.document" />
      </span>

      <card-elevation-item :elevation="item.document.elevation_max" class="is-ellipsed" />

      <span v-if="item.document.height_diff_up" :title="$gettext('height_diff_up')">
        <icon-height-diff-up />
        {{ item.document.height_diff_up }}&nbsp;m
      </span>

      <span v-if="item.document.height_diff_difficulties" :title="$gettext('height_diff_difficulties')">
        <fa-icon icon="arrows-alt-v" />
        {{ item.document.height_diff_difficulties }}&nbsp;m
      </span>

      <card-elevation-item v-if="item.document.elevation" :elevation="item.document.elevation" />

      <span v-if="item.document.waypoint_type">
        <icon-waypoint-type :waypoint-type="item.document.waypoint_type" />
        <span>{{ $gettext(item.document.waypoint_type, 'waypoint_types') | uppercaseFirstLetter }}</span>
      </span>
    </card-row>

    <card-row v-if="item.document.areas && item.document.areas.length">
      <card-region-item :document="item.document" />
    </card-row>

    <card-row>
      <span>
        <card-activities-item v-if="item.document.activities" :activities="item.document.activities" />
      </span>
      <span>
        <marker-image-count :image-count="item.document.img_count" />
        <span>&nbsp;</span>
        <marker-gps-trace v-if="item.document.geometry && item.document.geometry.has_geom_detail" />
      </span>
      <span> {{ $moment.timeAgo(item.time) }} </span>
      <span>
        <marker-condition v-if="documentType=='outing'" :condition="item.document.condition_rating" />
        <marker-quality :quality="item.document.quality" />
      </span>
    </card-row>
  </card-container>
</template>

<script>
  import forum from '@/js/apis/forum';
  import Gallery from '@/components/gallery/Gallery';
  import { cardMixin } from './utils/mixins.js';

  export default{

    components: {
      Gallery
    },

    filters: {
      max300chars(value) {
        if (value.length > 300) {
          return value.substring(0, 100) + '…';
        }
        return value;
      }
    },

    mixins: [
      cardMixin
    ],

    props: {
      item: {
        type: Object,
        required: true
      }
    },

    data() {
      return {
        actionLine: null,
        images: []
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
      }
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
        'updated xreport': this.$gettext('has updated the xreport')
      }[[this.item['change_type'], this.documentType].join(' ')];

      this.dates = this.$documentUtils.getOutingDatesLocalized(this.item['document']);

      if (this.item.image1) {
        this.images.push(this.item.image1);
      }

      if (this.item.image2) {
        this.images.push(this.item.image2);
      }

      if (this.item.image3) {
        this.images.push(this.item.image3);
      }
    }
  };
</script>

<style scoped lang="scss">

  @import '@/assets/sass/variables.scss';

  @media screen and (max-width: $tablet) {
    .feed-card{
      border-left:0!important;
      border-right:0!important;
    }
    .is-mobile-max-3-lines-height {
      // proprietary stuff, supported on limited browsers
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
    }
    .has-mobile-left-margin {
      margin-left: 5px;
    }
  }

  .card-image-content{
    display:flex;
    overflow: hidden;
  }

  .avatar{
    border-radius: 50%;
    width: 36px;
    height: 36px;
    vertical-align: bottom;
    margin-right: 0.5rem;
  }

  .has-3-images > div{
    width:33.33%;
    max-height: 275px;
    overflow: hidden;
  }

  .has-2-images > div{
    width:50%;
  }

  .has-2-images > div{
    width:100%;
  }

  .card-image-content > div > img{
    width:100%;
    box-sizing: border-box;
  }

</style>
