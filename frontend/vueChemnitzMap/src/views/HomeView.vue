<template>
  <div class="home-container">
    <!-- 过滤区 -->
    <aside class="filter-panel">
      <h3>Categories</h3>
      <ul>
        <li 
          v-for="cat in dataStore.categories" 
          :key="cat.id"
          :style="{
            color: cat.color,
            fontWeight: dataStore.filter.category === cat.name ? 'bold' : 'normal'
          }"
          @click="() => {
            dataStore.setCategory(cat.name);
            if (dataStore.sites[0]) centerAndPopup(dataStore.sites[0]);
          }"
        >
          {{ cat.name }}
        </li>
        <li 
          @click="() => {
            dataStore.setCategory('');
            if (dataStore.sites[0]) centerAndPopup(dataStore.sites[0]);
          }"
          :style="{ fontStyle: dataStore.filter.category === '' ? 'italic' : 'normal' }"
        >
          All
        </li>
      </ul>
      <input 
        type="text" 
        v-model="search" 
        placeholder="Search..." 
        @keyup.enter="onSearch"
      />
      <button @click="onSearch">Search</button>
    </aside>

    <!-- 地图 + 列表 -->
    <section class="content-panel">
      <l-map
        ref="mapRef"
        :zoom="13"
        :center="mapCenter"
        style="height: 400px; width: 100%;"
      >
        <l-tile-layer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <l-marker
          v-for="site in dataStore.sites"
          :key="site.id"
          :lat-lng="[site.lat, site.lon]"
          :ref="el => markerRefs[site.id] = el"
        >
          <l-popup>
            <strong>{{ site.name }}</strong><br/>
            {{ site.address }}
          </l-popup>
        </l-marker>
      </l-map>

      <div v-if="dataStore.loading">Loading...</div>
      <div v-if="dataStore.error">{{ dataStore.error }}</div>
      <ul v-else class="site-list">
        <li 
          v-for="site in dataStore.sites" 
          :key="site.id"
          @click="centerAndPopup(site)"
          style="cursor: pointer;"
        >
          {{ site.name }} ({{ site.category }})
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue';
import { useDataStore }  from '@/stores/dataStore';
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet';

export default {
  name: 'HomeView',
  components: { LMap, LTileLayer, LMarker, LPopup },
  setup() {
    const dataStore = useDataStore();
    const search    = ref('');
    const mapCenter = ref([50.83, 12.92]);
    const mapRef    = ref(null);
    const markerRefs = {};  // site.id → Marker 组件实例

    const onSearch = () => {
      dataStore.setQuery(search.value);
      // 等待列表和地图重渲染后再操作
      nextTick(() => {
        if (dataStore.sites[0]) centerAndPopup(dataStore.sites[0]);
      });
    };

    const centerAndPopup = (site) => {
      if (!site || !mapRef.value) return;
      const map  = mapRef.value.mapObject; // Leaflet 地图实例
      if (!map) return;

      const { lat, lon } = site;
      map.setView([lat, lon], 15, { animate: true });

      // 找到对应的 Marker 组件
      const markerComp = markerRefs[site.id];
      if (markerComp && markerComp.mapObject) {
        markerComp.mapObject.openPopup();
      }
    };

    onMounted(async () => {
      await dataStore.loadCategories();
      await dataStore.loadSites();
      // 首次加载后把第一个弹出
      nextTick(() => {
        if (dataStore.sites[0]) centerAndPopup(dataStore.sites[0]);
      });
    });

    return { dataStore, search, onSearch, mapCenter, mapRef, markerRefs, centerAndPopup };
  }
};
</script>

<style scoped>
.home-container {
  display: flex;
}
.filter-panel {
  width: 200px;
  padding: 1rem;
  border-right: 1px solid #ddd;
}
.content-panel {
  flex: 1;
  padding: 1rem;
}
.site-list {
  margin-top: 1rem;
  list-style: none;
  padding: 0;
}
.site-list li {
  padding: 0.25rem 0;
  border-bottom: 1px solid #eee;
}
</style>
