<template>
  <div class="section content">
    <html-header :title="$gettext('My preferences')" />

    <h2 v-translate>lang</h2>

    <div class="field">
      <div class="buttons">
        <button
          v-for="(language, key) of $language.availableUI"
          :key="key"
          :class="{ 'is-primary': $language.current === key }"
          type="button"
          class="button"
          @click="$language.setCurrent(key)"
        >
          {{ language }}
        </button>
      </div>
    </div>

    <h2 v-translate>Home page feed parameters</h2>
    <loading-notification :promise="promise" />
    <div v-if="preferences">
      <p v-translate>Here you may set activity and region filters that will apply to the homepage feed.</p>
      <p v-translate>
        Only status updates with the selected activities and in the selected areas are shown in your homepage feed.
        Status updates from followed users will always be shown.
      </p>
      <div class="field">
        <input-checkbox v-model="preferences.followed_only" @change="save">
          <span v-translate>Show only updates from followed users in the homepage feed</span>
        </input-checkbox>
      </div>

      <div v-if="!preferences.followed_only">
        <h3 v-translate>langs</h3>
        <div class="field is-grouped">
          <div v-for="(language, key) of $language.availableUI" :key="key" class="control">
            <button
              :class="{ 'is-primary': preferences.langs.indexOf(key) > -1 }"
              type="button"
              class="button"
              @click="toggle(key, preferences.langs)"
            >
              {{ language }}
            </button>
          </div>
        </div>

        <h3 v-translate>activities</h3>
        <div class="field is-grouped">
          <input-activity v-model="preferences.activities" @input="save" />
        </div>

        <h3>{{ $gettext('areas') | uppercaseFirstLetter }}</h3>

        <div class="columns is-multiline">
          <div class="column is-narrow">
            <input-document document-type="area" @input="addArea" />
          </div>
          <div class="column">
            <div class="columns is-multiline">
              <div v-for="document in preferences.areas" :key="document.document_id" class="column is-3">
                <document-card :document="document" show-delete-button @delete="removeArea(document)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import c2c from '@/js/apis/c2c';
import noRobotsMixin from '@/js/no-robots-mixin';

export default {
  mixins: [noRobotsMixin],

  data() {
    return {
      promise: null,
    };
  },

  computed: {
    preferences() {
      return this.promise.data;
    },
  },

  created() {
    this.promise = c2c.userProfile.preferences.get();
  },

  methods: {
    toggle(item, array) {
      if (array.indexOf(item) > -1) {
        array.splice(array.indexOf(item), 1);
      } else {
        array.push(item);
      }

      this.save();
    },

    addArea(area) {
      this.preferences.areas.push(area);
      this.save();
    },

    removeArea(area) {
      this.preferences.areas = this.preferences.areas.filter((doc) => doc.document_id !== area.document_id);
      this.save();
    },

    save() {
      c2c.userProfile.preferences.post(this.preferences);
    },
  },
};
</script>

<style scoped>
.cards-container > div {
  flex-flow: wrap row;
  justify-content: center;
  margin: auto;
}
</style>
