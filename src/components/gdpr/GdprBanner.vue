<template>
  <div class="gdpr-content" :class="{ active: active }">
    <h4 class="title" v-translate>GDPR.TOAST.TITLE</h4>
    <div class="message">
      <span v-translate>GDPR.TOAST.MESSAGE</span>
      <a @click="displayConfigGDPR()" v-translate>GDPR.TOAST.LINK</a>
    </div>
    <button @click="acceptGDPR(false)" class="accept" v-translate>REJECT</button>
    <button @click="acceptGDPR(true)" class="accept" v-translate>ACCEPT</button>
  </div>
</template>

<script>
const GDPR_LOCAL_SAVE = 'gdpr';

export default {
  data() {
    return {
      active: false,
    };
  },

  computed: {
    gdprValue: {
      get: function () {
        return this._gdprValue;
      },
      set: function (newValue) {
        this._gdprValue = newValue;
        this.active = !newValue;
        !!newValue && localStorage.setItem(GDPR_LOCAL_SAVE, JSON.stringify(newValue));
        if (newValue?.statictics) {
          this.$ga.enable();
        } else {
          this.$ga.disable();
        }
      },
    },
  },

  created() {
    try {
      this.gdprValue = JSON.parse(localStorage.getItem(GDPR_LOCAL_SAVE));
    } catch (err) {
      this.gdprValue = undefined;
    }
  },

  methods: {
    displayConfigGDPR() {
      console.alert('modal');
    },

    acceptGDPR(accept) {
      // this.gdprService.enableAll();
      this.gdprValue = accept ? { statictics: true } : { statictics: false };
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/sass/variables.scss';

.gdpr-content {
  z-index: 99;
  position: fixed;
  top: 0;
  width: 50%;
  left: calc(25% - 10px);
  padding: 10px;

  margin: 0 auto;
  flex-direction: column;
  display: flex;
  background-color: white;
  box-shadow: none;
  transform: translateY(-100%);
  transition: all 0.25s ease-in-out;

  &.active {
    box-shadow: rgba(0, 0, 0, 0.3) 1px 1px 6px 0;
    transform: translateY(0);
  }

  .title {
    color: black;
    padding-bottom: 10px;
    font-weight: bold;
  }

  .message {
    a {
      color: black;
      cursor: pointer;
    }
  }

  .accept {
    align-self: flex-end;
  }
}
</style>
