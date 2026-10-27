<template>
  <card-container :document="document">
    <card-row>
      <marker-document-type :document-type="documentType" class="is-pulled-left is-size-3" />
      <document-title :document="item.document" class="has-text-weight-bold has-left-padding" />
      <span v-if="documentType === 'outing'" class="is-pulled-right has-left-margin-mobile">{{ dates }}</span>
      <span v-else> </span>
    </card-row>

    <card-row v-if="locale?.summary">
      <p class="is-max-3-lines-height">{{ max300chars($filters.stripMarkdown(locale.summary as string)) }}</p>
    </card-row>

    <card-row v-if="images.length">
      <gallery :images="images" />
    </card-row>

    <div class="row">
      <span :title="$gettext('User avatar')">
        <img
          v-if="!useDefaultAvatarIcon"
          class="avatar"
          alt="Avatar"
          @error="useDefaultAvatarIcon = true"
          :src="forumAvatarUrl + item.user.forum_username + '/36/1_1.png'"
          loading="lazy"
        />
        <fa-icon v-else icon="user" class="is-size-3 has-text-grey" />
      </span>
      <document-title :document="item.user" />
      <span class="has-text-weight-normal">&nbsp;{{ actionLine }}</span>
    </div>

    <card-row v-if="documentType != 'article' && documentType != 'book' && documentType != 'xreport'">
      <span v-if="documentType === 'outing' || documentType === 'route'">
        <icon-ratings class="card-icon" />
        <document-rating :document="item.document" />
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
        <span>{{ $filters.uppercaseFirstLetter($gettext(item.document.waypoint_type, 'waypoint_types')) }}</span>
      </span>
    </card-row>

    <div class="row is-flex is-justify-content-flex-end is-mobile">
      <card-region-item
        v-if="item.document.areas && item.document.areas.length"
        :document="item.document"
        class="is-not-ellipsed"
      />
      <span class="">
        <card-activities-item v-if="item.document.activities" :activities="item.document.activities" />
      </span>
      <span class="outing-icons">
        <marker-soft-mobility v-if="documentType === 'outing' && item.document.public_transport" />
        <marker-image-count :image-count="item.document.img_count" />
        <marker-gps-trace v-if="item.document.geometry && item.document.geometry.has_geom_detail" />
        <marker-condition v-if="documentType === 'outing'" :condition="item.document.condition_rating" />
        <marker-quality :quality="item.document.quality" />
      </span>
    </div>
  </card-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import CardActivitiesItem from './utils/CardActivitiesItem.vue';
import CardContainer from './utils/CardContainer.vue';
import CardElevationItem from './utils/CardElevationItem.vue';
import CardRegionItem from './utils/CardRegionItem.vue';
import CardRow from './utils/CardRow.vue';
import { cardProps } from './utils/card';

import Gallery from '@/components/gallery/Gallery.vue';
import forum from '@/js/apis/forum';
import { useGlobalProperties } from '@/js/composables/global-properties';

const props = defineProps({
  ...cardProps,
  item: {
    type: Object,
    required: true,
  },
});

const { $documentUtils, $gettext } = useGlobalProperties();

const forumAvatarUrl = forum.url + '/user_avatar/' + forum.url.replace('https://', '') + '/';

const useDefaultAvatarIcon = ref(false);

const document = computed(() => props.item.document);
const documentType = computed(() => $documentUtils.getDocumentType(document.value['type']));
const locale = computed(() => $documentUtils.getLocaleSmart(props.item.document));
const dates = computed(() => $documentUtils.getOutingDatesLocalized(props.item['document']));
const images = computed(() => [props.item.image1, props.item.image2, props.item.image3].filter(Boolean));

const actionLine = computed(
  () =>
    ({
      'added_photos article': $gettext('has added images to article'),
      'added_photos book': $gettext('has added images to book'),
      'added_photos area': $gettext('has added images to area'),
      'added_photos outing': $gettext('has added images to outing'),
      'added_photos route': $gettext('has added images to route'),
      'added_photos waypoint': $gettext('has added images to waypoint'),
      'added_photos xreport': $gettext('has added images to xreport'),
      'created article': $gettext('has created a new article'),
      'created book': $gettext('has created a new book'),
      'created image': $gettext('has created a new image'),
      'created outing': $gettext('has created a new outing'),
      'created route': $gettext('has created a new route'),
      'created waypoint': $gettext('has created a new waypoint'),
      'created xreport': $gettext('has created a new xreport'),
      'updated area': $gettext('has updated the area'),
      'updated article': $gettext('has updated the article'),
      'updated book': $gettext('has updated the book'),
      'updated image': $gettext('has updated the image'),
      'updated outing': $gettext('has updated the outing'),
      'updated route': $gettext('has updated the route'),
      'updated waypoint': $gettext('has updated the waypoint'),
      'updated xreport': $gettext('has updated the xreport'),
    })[[props.item['change_type'], documentType.value].join(' ')]
);

function max300chars(value: string) {
  return value.length > 300 ? value.substring(0, 300) + '…' : value;
}
</script>

<style scoped lang="scss">
@media screen and (max-width: $tablet) {
  .feed-card {
    border-left: 0 !important;
    border-right: 0 !important;
  }
  .has-left-margin-mobile {
    margin-left: 5px;
  }
}

.has-left-padding {
  padding-left: 0.5rem;
}

.is-max-3-lines-height {
  // proprietary stuff, supported on limited browsers
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-image-content {
  display: flex;
  overflow: hidden;
}

.avatar {
  border-radius: 50%;
  width: 24px;
  height: 24px;
  vertical-align: bottom;
  margin-right: 0.5rem;
}

.card-image-content > div > img {
  width: 100%;
  box-sizing: border-box;
}

.row {
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
  min-height: 29px;
  color: $text;
  align-items: center;

  .column {
    max-height: 58px;
  }
}

.is-not-ellipsed {
  white-space: normal !important;
  flex: 1;
}

.outing-icons {
  min-width: 5.4rem;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;

  span {
    padding: 0 0.1rem;
  }
}
</style>
