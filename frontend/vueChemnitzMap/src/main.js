// frontend/vueChemnitzMap/src/main.js

import L from 'leaflet';        // 走到 shim，拿到 default
window.L = L;                   // vue3-leaflet 会优先用 window.L
import 'leaflet/dist/leaflet.css';

import { createApp } from 'vue';
import { createPinia }  from 'pinia';
import App             from './App.vue';
import router          from './router';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
