<template>
  <div id="app">
    <div class="page">
      <router-view/>
    </div>
    <div id="nav">
      <router-link to="/">Home</router-link>
      <router-link to="/contact">Contact</router-link>
    </div>
  </div>
</template>

<style>
#app {
  font-family: 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #0c0032;
  text-align: center;
  font-size: 1.5em;
}
#nav {
  padding: 0.2em;
  background-color: #282828;
  color: #ffffff;
  font-weight: bold;
}

#nav a {
  font-weight: bold;
  color: #ffffff;
  width: 5em;
  display: inline-block;
  background-color: #190061;
  border: 1px solid #190061;
  text-decoration: none;
}

#nav a.router-link-exact-active {
  background-color: #3500d3;
  border: 1px solid #ffffff;
}

a {
  color: #240090;
}

h1 {
  color: #3500d3;
  font-size: 2.5em;
}

#app {
  height: 100%;
}

.page {
  min-height: 100%;
  margin-bottom: -40.5px;
}
.page:after {
  content: "";
  display: block;
}
#nav, .page:after {
  height: 31.5px; 
}
h1, h2, h3, h4, h5, h6 {
  font-family: 'Changa', sans-serif;
}
</style>
