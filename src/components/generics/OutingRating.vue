<template>
  <span>
    <span
      v-for="rating of availableRatings"
      :key="rating"
      :title="$gettext(rating)">
      {{ document[rating] }}
    </span>
  </span>

</template>

<script>

  export default {
    props: {
      document: {
        type: Object,
        required: true
      }
    },

    computed: {
      availableRatings() {
        return this.$options.ratings.filter((rating) => this.document[rating] !== undefined);
      }
    },

    ratings: [
      'global_rating',
      'rock_free_rating',
      'ice_rating',
      'via_ferrata_rating',
      'engagement_rating',
      'equipment_rating',
      'ski_rating',
      'labande_global_rating',
      'hiking_rating',
      'snowshoe_rating',
      'mtb_up_rating',
      'mtb_down_rating'
    ]
  };

</script>
