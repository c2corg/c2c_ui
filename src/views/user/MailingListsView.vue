<template>
  <div v-if="mailinglists" class="section content">
    <html-header title="My mailing lists" />
    <h1>
      <fa-icon icon="at" />
      <span v-translate>My mailing lists</span>
    </h1>

    <p v-translate>Here you may change your subscriptions to snow forecast mailing lists.</p>
    <div v-for="mailinglist in Object.keys(mailinglists)" :key="mailinglist" class="field">
      <input-checkbox v-model="mailinglists[mailinglist]" @change="save">
        {{ mailinglist }} list
      </input-checkbox>
    </div>
  </div>
</template>

<script>
  import c2c from '@/js/apis/c2c';

  export default {

    data() {
      return {
        mailinglists: null,
        constants: c2c
      };
    },

    created() {
      c2c.userProfile.mailinglists.get().then(response => {
        this.mailinglists = response.data;
      });
    },

    methods: {
      save() {
        c2c.userProfile.mailinglists.post(this.mailinglists);
      }
    }
  };
</script>

<style scoped>

.cards-container > div{
    flex-flow:wrap row;
    justify-content:center;
    margin:auto;
}

</style>
