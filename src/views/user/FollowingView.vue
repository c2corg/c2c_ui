<template>
  <div class="section">
    <html-header :title="$gettext('Followed users')"/>
    <h1 class="title is-1" v-translate>
      Followed users
    </h1>

    <div class="columns is-multiline">
      <div class="column is-12" v-translate>
        Here is the list of users you are following and whose activity you will see in your personal feed.
      </div>

      <div class="column is-narrow">
        <input-document document-type="profile" @input="add" />
      </div>
      <div class="column">
        <div v-if="following.data" class="columns is-multiline">
          <div
            v-for="document in following.data.following"
            :key="document.document_id"
            class="column is-3">
            <document-card
              :document="document"
              show-delete-button
              @delete="remove(document)"/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import c2c from '@/js/apis/c2c';

  export default {

    data() {
      return {
        following: null,
        newUser: null
      };
    },

    created() {
      this.load();
    },

    methods: {
      load() {
        this.following = c2c.userProfile.following.get();
      },

      add(profile) {
        c2c.userProfile.following.add(profile.document_id).then(() => {
          this.load();
        });
      },

      remove(document) {
        c2c.userProfile.following.remove(document.document_id).then(() => {
          this.load();
        });
      }
    }
  };
</script>
