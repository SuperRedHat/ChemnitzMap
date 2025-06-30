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
          @click="() => handleCategoryClick(cat.name)"
        >
          {{ cat.name }}
        </li>
        <li 
          @click="() => handleCategoryClick('')"
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
        @ready="onMapReady"
        :zoom="13"
        :center="mapCenter"
        style="height: 400px; width: 100%;"
      >
        <l-tile-layer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <!-- 每个 marker 触发 ready 事件，拿到原生实例 -->
        <l-marker
          v-for="site in dataStore.sites"
          :key="site.id"
          :lat-lng="[site.lat, site.lon]"
          @ready="marker => onMarkerReady(site.id, marker)"
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
          @click="() => centerAndPopup(site.id)"
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
    let mapInstance = null;
    const markerInstances = {};  // site.id -> L.Marker

    // 后端数据加载完成后，自动居中首条
    const initCenter = () => {
      if (dataStore.sites[0] && mapInstance) {
        centerAndPopup(dataStore.sites[0].id);
      }
    };

    // 保存原生 L.Map 实例
    const onMapReady = ({ map }) => {
      mapInstance = map;
      initCenter();
    };

    // 保存原生 L.Marker 实例
    const onMarkerReady = (id, marker) => {
      markerInstances[id] = marker;
    };

    // 点击分类
    const handleCategoryClick = (category) => {
      dataStore.setCategory(category);
      nextTick(initCenter);
    };

    // 搜索执行
    const onSearch = () => {
      dataStore.setQuery(search.value);
      nextTick(initCenter);
    };

    // 定位并打开对应 id 的弹窗
    const centerAndPopup = (siteId) => {
      const site = dataStore.sites.find(s => s.id === siteId);
      if (!site || !mapInstance) return;
      const { lat, lon } = site;
      mapInstance.setView([lat, lon], 15, { animate: true });
      const marker = markerInstances[siteId];
      if (marker) marker.openPopup();
    };

    onMounted(async () => {
      await dataStore.loadCategories();
      await dataStore.loadSites();
      nextTick(initCenter);
    });

    return {
      dataStore,
      search,
      mapCenter,
      onMapReady,
      onMarkerReady,
      onSearch,
      centerAndPopup,
      handleCategoryClick
    };
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
