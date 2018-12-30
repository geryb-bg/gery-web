<template>
  <div class="home">
    <img alt="BB-8 photo header." src="../assets/bb8.jpg" class="header-img">
    <div class="content">
      <img alt="Picture of me." src="../assets/me.jpg" class="me-img">
      <HelloWorld msg="Hi! My name is Gergana,"/>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from "@/components/HelloWorld.vue";

export default {
  name: "home",
  components: {
    HelloWorld
  }
};
</script>

<style scoped>
.content {
  text-align: left;
  max-width: 600px;
  margin: auto;
}
.home .header-img {
  width: 100%;
}
.me-img {
  width: 6em;
  min-width: 50px;
  border-radius: 50%;
  margin-left: 1em;
  margin-top: -3.5em;
}
</style>