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
  color: var(--c2c-text);
  align-items: center;
  justify-content: space-between;
  display: flex;
}

@media screen and (--c2c-max-tablet) {
  // .is-nowrap: component roots like card-elevation-item now get the slotted scope too
  :slotted(span.is-ellipsed:not(.is-nowrap)),
  :slotted(p.is-ellipsed) {
    white-space: normal;
  }
}

div:not(:last-child) {
  box-shadow: 0 1px 2px rgba(10, 10, 10, 0.1);
}
</style>
