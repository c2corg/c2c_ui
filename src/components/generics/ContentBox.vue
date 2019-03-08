<template>
  <div class="box" @click="click">
    <slot />
  </div>
</template>

<script>
  export default {

    methods: {
      click() {
        this.$emit('click');
      }
    }
  };
</script>

<style scoped lang="scss">

@import '@/assets/sass/variables.scss';

//default
$cb-shadow : 0;
$cb-border-top : 0;
$cb-border-left: 0;
$cb-border-bottom: 0;
$cb-margin-bottom: 0;

$cb-skin : skin4;

@if ($cb-skin == skin1) { //no border, small shadow
    $cb-shadow : 0 2px 3px rgba(10, 10, 10, 0.10), 0 0 0 1px rgba(10, 10, 10, 0.1);
    $cb-margin-bottom: 1rem;
}
@elseif ($cb-skin == skin2) { //primary big border top, small shadow
    $cb-shadow : 0 2px 3px rgba(10, 10, 10, 0.10), 0 0 0 1px rgba(10, 10, 10, 0.1);
    $cb-border-top : 4px solid $primary;
    $cb-margin-bottom: 1rem;
}
@elseif ($cb-skin == skin3) { // primary big border left, no shadow
    $cb-border-left : 4px solid $primary;
    $cb-border-top : 1px solid $primary;
    $cb-margin-bottom: 1rem;
}
@elseif ($cb-skin == skin4) { // pure :)
    // $cb-border-bottom : 1px solid #e5e5e5;
    // $cb-margin-bottom: 1rem;
}

.content-box{
    padding:1rem;
    background:$white;
    box-shadow:$cb-shadow;
    border-top:$cb-border-top;
    border-left:$cb-border-left;
}

.content-box:not(:last-child){
    margin-bottom:$cb-margin-bottom;
    border-bottom:$cb-border-bottom;
}

</style>
