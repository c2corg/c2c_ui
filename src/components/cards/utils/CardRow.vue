<template>
  <div>
    <slot />
  </div>
</template>

<style scoped lang="scss">
div {
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
  min-height: 29px;
  color: $text;
  align-items: center;
  justify-content: space-between;
  display: flex;
}

@media screen and (max-width: $tablet) {
  //div {
    //align-items: flex-start;
    //justify-content: center;
  //}
  span.is-ellipsed,
  p.is-ellipsed {
    white-space: normal;
  }
}

div:not(:last-child) {
  box-shadow: 0 1px 2px rgba(10, 10, 10, 0.1);
}
</style>
