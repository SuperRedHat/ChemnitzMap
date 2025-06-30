<template>
  <div class="home-container">
    <!-- 过滤区 -->
    <aside class="filter-panel">
      <h3>Categories</h3>
      <ul>
        <li 
          v-for="cat in dataStore.categories" 
          :key="cat.id"
          :style="{ color: cat.color, fontWeight: dataStore.filter.category === cat.name ? 'bold' : 'normal' }"
          @click="dataStore.setCategory(cat.name)"
        >
          {{ cat.name }}
        </li>
        <li @click="dataStore.setCategory('')" :style="{ fontStyle: dataStore.filter.category === '' ? 'italic' : 'normal' }">
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

    <!-- 主内容：地图 + 列表 -->
    <section class="content-panel">
      <l-map 
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
        >
          <l-popup>
            <div>
              <strong>{{ site.name }}</strong><br/>
              {{ site.address }}
            </div>
          </l-popup>
        </l-marker>
      </l-map>

      <div v-if="dataStore.loading">Loading...</div>
      <div v-if="dataStore.error">{{ dataStore.error }}</div>
      <ul v-else class="site-list">
        <li v-for="site in dataStore.sites" :key="site.id">
          {{ site.name }} ({{ site.category }})
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useDataStore }  from '@/stores/dataStore';
import { LMap, LTileLayer, LMarker, LPopup } from 'vue3-leaflet';

export default {
  components: { LMap, LTileLayer, LMarker, LPopup },
  setup() {
    const dataStore = useDataStore();
    const search = ref('');
    const mapCenter = ref([50.83, 12.92]); // Chemnitz approx

    const onSearch = () => {
      dataStore.setQuery(search.value);
    };

    onMounted(async () => {
      await dataStore.loadCategories();
      await dataStore.loadSites();
    });

    return { dataStore, search, onSearch, mapCenter };
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
