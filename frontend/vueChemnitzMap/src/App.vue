<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>Chemnitz Cultural Map</h1>
      <nav>
        <router-link to="/">地图</router-link>
        <router-link to="/about">关于</router-link>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #42b883;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.app-header nav {
  display: flex;
  gap: 1rem;
}

.app-header a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.app-header a:hover,
.app-header a.router-link-active {
  background: rgba(255,255,255,0.2);
}

.app-main {
  flex: 1;
  overflow: hidden;
}
</style>