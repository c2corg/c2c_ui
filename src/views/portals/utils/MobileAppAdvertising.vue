<template>
  <div>
    <p v-translate>
      Find all Camptocamp in the mountains with the new mobile application
    </p>
    <div class="columns">
      <div class="column has-text-centered">
        <a
          href="https://play.google.com/store/apps/details?id=com.webfit.camptocamp&amp;hl=fr"
          :title="$gettext('Application')"
          target="_blank"
          rel="noreferer">
          <img
            src="@/assets/img/app/googleplay.svg"
            url="@/assets/img/app/googleplay.svg"
            alt="Google play">
        </a>
      </div>
      <div class="column has-text-centered">
        <a
          href="https://itunes.apple.com/fr/app/camptocamp/id1253411269"
          :title="$gettext('Application')"
          target="_blank"
          rel="noreferer">
          <img
            src="@/assets/img/app/appstore.svg"
            url="@/assets/img/app/appstore.svg"
            alt="Appstore">
        </a>
      </div>
    </div>
  </div>

</template>

<style scoped>
    img{
        width:40%;
        padding-top:1rem;
    }
</style>
