<template>
  <aside>
    <div class="Favoris">
      <div class="container">
        <h1>Connection requise pour accéder aux itinéraires enregistrés</h1>
        <br />
        <button>Login</button>
      </div>

      <div class="container0">
        <div>
          <b-card-text> Itinéraires enregistrés </b-card-text>
        </div>
      </div>
    </div>
  </aside>
</template>

<script></script>

<style>
@media screen and(max-width: 844px ) {
  .container {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap-reverse;
  }

  .container0 {
    display: flex;
    flex-direction: column;
    background-color: lightgray;
  }
}

@media screen and (max-width: 1080px) {
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    flex-wrap: wrap;
    margin-top: 50%;
  }

  .container0 {
    display: flex;
    flex-direction: column;
  }
}
</style>
