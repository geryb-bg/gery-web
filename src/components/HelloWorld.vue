<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <p>
      but I usually go by Gery because that's a bit easier to pronounce. I am a South African software developer, adventurer and Star Wars geek extraordinaire.
    </p>
    <h2>I work in the R&D team at <a href="https://www.bbd.co.za/" target="_blank">BBD</a>.</h2>
    <p>
      We do a variety of things such as training, consulting and research. My personal areas of interest are web and IoT, and more specifically the convergence of these two technologies. You can check out some of my personal projects on <a href="https://github.com/geryb-bg" target="_blank">GitHub</a>.
    </p>
    <h3>I love speaking in community, below you can see some of my more recent talks:</h3>
    <ul class="talks">
      <li>
        <a href="https://www.youtube.com/watch?v=A5s0HiKQb4M" target="_blank">The "I" in IoT</a>
        <h4>DevFest South Africa</h4>
        <p>1 December 2018</p>
      </li>
      <li>
        <a href="" target="_blank">Automate your life with Azure</a>
        <h4>JoziJS</h4>
        <p>22 November 2018</p>
      </li>
      <li>
        <a href="https://www.youtube.com/watch?v=VofwRvURf6s" target="_blank">The Physical Web and Beyond</a>
        <h4>DevConf Johannesburg</h4>
        <p>27 March 2018</p>
      </li>
      <li>
        <a href="https://www.youtube.com/watch?v=6B1peJkqEGQ" target="_blank">A Web of Things</a>
        <h4>JoziJS</h4>
        <p>18 January 2018</p>
      </li>
    </ul>
    <p>For a full list of talks you can take a look at <a href="https://www.youtube.com/watch?v=jDt559_PeWI&list=PLzkFC7qpj2Jnqc1coWb3Jgp6QwP4gbocC" target="_blank">this YouTube playlist</a>.</p>
    <h3>I am also trying out this blogging thing.</h3>
    <p class="last">
      I haven't gotten very far with it, but you can check out my first article on <a href="https://medium.com/@gerybbg" target="_blank">Medium</a>.
    </p>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  props: {
    msg: String
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 25px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 0.3em;
  padding: 1em;
  margin-bottom: 0.5em;
  width: 20em;
  box-shadow: 1px 1px 1px #282828;
}
.talks li a {
  font-weight: bold;
}
.talks li h4 {
  margin: 0;
}
.talks li p {
  margin: 0;
  font-size: 0.7em;
}
h1, h2, h3, p {
  padding-bottom: 15px;
}
.last {
  padding-bottom: 30px;
}
</style>
