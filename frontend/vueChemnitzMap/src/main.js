// frontend/vueChemnitzMap/src/main.js
import 'leaflet/dist/leaflet.css';

import { createApp } from 'vue';
import { createPinia }  from 'pinia';
import App             from './App.vue';
import router          from './router';
import i18n            from './locales';
import { setupInterceptors } from './api';

// Element Plus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(i18n); 
app.use(ElementPlus);

// 在应用初始化后设置拦截器
setupInterceptors();

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount('#app');