<template>
  <section>
    <div class="columns">
      <div class="column is-12-mobile">
        <div class="subtitle" v-translate>
          Welcome to Itinévert, the tool for planning your outing using public transport.
        </div>
        <div class="desc">
          <span v-translate>
            This tool allows you to search for routes or access points accessible by public transport in mainland
            France.
          </span>
          <span v-translate>
            The destination can be a mountain range or a maximum travel time from your starting point.
          </span>
          <span v-translate>The results displayed take into account your departure date and time.</span>
        </div>
        <div class="desc" v-translate>
          <span v-translate>
            If you see any improvements or missing lines, you can provide feedback via the links provided in
          </span>
          <a
            target="_blank"
            href="https://forum.camptocamp.org/t/la-mobilite-douce-clef-en-main-debarque-sur-camptocamp/351137"
            v-translate
          >
            this message.
          </a>
        </div>
        <div class="columns">
          <div class="column is-12-mobile">
            <div class="left">
              <p class="link-header" v-translate>Other tools can complement Itinévert:</p>
              <ul class="links">
                <li>
                  <a
                    target="_blank"
                    href="https://www.camptocamp.org/articles/219828/fr/mobilite-douce-sur-camptocamp"
                    v-translate
                    >Sustainable mobility on Camptocamp
                  </a>
                </li>
                <li>
                  <a target="_blank" href="https://www.camptocamp.org/outings?owpt=true" v-translate
                    >Outings using sustainable transportation on Camptocamp
                  </a>
                </li>
                <li>
                  <a target="_blank" href="https://hometosummit.vercel.app/" v-translate
                    >Map of routes accessible by bike-train
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div class="column is-12-mobile">
            <router-link :to="{ name: 'itinevert' }" class="menu-brand has-text-centered">
              <img src="@/assets/img/logo_itinévert_orange.svg" alt="Itinévert" class="logo-itinevert" />
            </router-link>
            <p class="petzl-header" v-translate>This device is supported by the Petzl Foundation</p>
            <a href="https://www.petzl.com/fondation" target="_blank" class="menu-brand has-text-centered">
              <img
                src="@/assets/img/yeti/logo-fondation-petzl.jpg"
                alt="Fondation Petzl"
                class="logo-fondation-petzl"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'ItinevertBanner',
};
</script>

<style scoped lang="scss">
.link-header,
.petzl-header {
  font-weight: 600;
}

.petzl-header {
  padding-top: 16px;
  text-align: center;
}

.logo-fondation-petzl {
  max-width: 10%;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.logo-itinevert {
  max-width: 15%;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.desc {
  padding-bottom: 1rem;
}

.links {
  display: flex;
  flex-direction: column;
}

.left {
  height: 100%;
}

@media screen and (max-width: 528px) {
  .subtitle {
    margin-top: 8px;
  }
}

@media screen and (max-width: $tablet) {
  .logo-fondation-petzl {
    max-width: 10%;
  }
}
</style>
