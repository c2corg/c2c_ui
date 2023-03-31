<template>
  <section>
    <div class="columns">
      <div class="column is-12-mobile">
        <div class="subtitle" v-translate>
          Camptocamp.org aims to facilitate information sharing between mountain addicts and contribute to the safety of
          mountain activities.
        </div>
        <div class="columns">
          <div class="column is-12-mobile">
            <div>
              <p v-translate>All in store for you:</p>
              <ul>
                <li>
                  <icon-route fixed-width />
                  <router-link to="routes" v-translate>Routes to explore</router-link>
                </li>
                <li>
                  <icon-outing fixed-width />
                  <router-link to="outings" v-translate>
                    Outings, with the latest conditions in the mountains
                  </router-link>
                </li>
                <li>
                  <icon-xreport fixed-width />
                  <span v-translate>Accidents/Incidents database:</span>
                  <router-link to="serac">SERAC</router-link>
                </li>
                <li>
                  <icon-yeti fixed-width />
                  <span v-translate>Avalanche risk evaluation tool:</span>
                  <router-link to="yeti">Yeti</router-link>
                </li>
                <li class="with-circle">
                  <span v-translate>Library:</span>
                  <icon-article />
                  <router-link to="articles" v-translate>articles</router-link>
                  <span v-translate>and</span>
                  <icon-book />
                  <router-link to="books" v-translate>books</router-link>
                </li>
                <li>
                  <icon-forum fixed-width />
                  <router-link to="forum" v-translate>
                    Forum: a place to chat about technical matters, or just petty talk
                  </router-link>
                </li>
              </ul>
            </div>
          </div>
          <div class="column is-12-mobile">
            <p>
              <router-link :to="{ name: 'article', params: { id: 106726 } }" v-translate>
                Camptocamp Association
              </router-link>
              <span v-translate>
                is a non profit organization, where volunteers manage the camptocamp.org website
              </span>
            </p>
            <router-link :to="{ name: 'article', params: { id: 106726 } }" class="menu-brand has-text-centered">
              <img src="@/assets/img/logo_asso.svg" alt="Camptocamp Association" class="logo-association" />
            </router-link>
            <ul>
              <li>
                <a href="https://www.helloasso.com/associations/camptocamp-association" :title="$gettext('Join us')">
                  <span v-translate>Want to take part or get involved? Join us!</span>
                </a>
              </li>
              <li>
                <fa-icon icon="heart" class="donate-icon" />
                <a href="https://www.helloasso.com/associations/camptocamp-association" :title="$gettext('Donate')">
                  <span v-translate>Want to contribute financially (hosting, developing...)? Donate!</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'HomeBanner',
};
</script>

<style scoped lang="scss">
.intro-banner {
  padding-bottom: 40px;
  padding-top: 70px;
  color: #fff;
  width: 80%;
  min-width: 730px;
  height: 100%;
  margin: auto;
  align-items: center;
}

.title.is-4 {
  margin-top: 25px;
}

.with-circle {
  list-style: disc !important;
  margin-left: $size-3;
}

@media screen and (max-width: $tablet) {
  .intro-banner {
    width: 100%;
    min-width: auto;
    padding: 20px;
  }

  .title.is-4 {
    margin-top: 0;
  }
}

.logo-association {
  max-width: 35%;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
</style>
