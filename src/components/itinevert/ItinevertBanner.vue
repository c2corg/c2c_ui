<template>
  <section>
    <div class="banner-container">
      <div class="texts">
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
        <div class="desc">
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
        <div>
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
            <!-- more links can be added here -->
          </ul>
        </div>
      </div>
      <div class="logos">
        <router-link :to="{ name: 'itinevert' }" class="menu-brand has-text-centered logo-itinevert">
          <img src="@/assets/img/logo_itinévert_orange.svg" alt="Itinévert" />
        </router-link>
        <p class="petzl-header" v-translate>This device is supported by the Petzl Foundation</p>
        <a
          href="https://www.petzl.com/fondation"
          target="_blank"
          class="menu-brand has-text-centered logo-fondation-petzl"
        >
          <img src="@/assets/img/yeti/logo-fondation-petzl.jpg" alt="Fondation Petzl" />
        </a>
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
.banner-container {
  display: grid;
  grid-template-columns: 1fr 25%;
  align-items: start;
}

.link-header,
.petzl-header {
  font-weight: 600;
}

.petzl-header {
  padding-top: 16px;
  padding-bottom: 8px;
  text-align: center;
}

.logos {
  height: 100%;
  padding: 0.75rem;
}

.texts {
  padding: 0.75rem;
  padding-left: 0;
}

.logo-fondation-petzl {
  display: block;
  position: relative;
  min-height: 35%;
  width: 100%;
}

.logo-fondation-petzl img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-itinevert {
  display: block;
  position: relative;
  min-height: 35%;
  width: 100%;
}

.logo-itinevert img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.desc {
  padding-bottom: 1rem;
}

.links {
  display: flex;
  flex-direction: column;
}

@media screen and (max-width: 528px) {
  .subtitle {
    margin-top: 8px;
  }
}

@media screen and (max-width: $tablet) {
  .banner-container {
    display: flex;
    flex-direction: column;
  }

  .logos {
    margin-right: auto;
    margin-left: auto;
  }

  .logo-itinevert {
    height: 50px;
    width: 100%;
  }

  .logo-fondation-petzl {
    height: 50px;
    width: 100%;
  }

  .logo-itinevert img {
    display: block;
  }

  .logo-fondation-petzl img {
    display: block;
  }
}
</style>
