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
      <div id="map-container" style="height: 400px; width: 100%;"></div>

      <div v-if="dataStore.loading">Loading...</div>
      <div v-if="dataStore.error" style="color: red;">{{ dataStore.error }}</div>
      
      <div class="results-header">
        <h3>文化地点列表 ({{ dataStore.sites.length }} 个结果)</h3>
      </div>
      
      <ul v-if="!dataStore.loading" class="site-list">
        <li 
          v-for="site in dataStore.sites" 
          :key="site.id"
          @click="() => centerAndPopup(site.id)"
          class="site-item"
        >
          <div class="site-info">
            <h4 class="site-name" :style="{ color: site.color }">
              {{ site.name }}
            </h4>
            <div class="site-details">
              <span class="site-category">{{ site.category }}</span>
              <span v-if="site.address" class="site-address">
                📍 {{ site.address }}
              </span>
            </div>
          </div>
          <div class="site-actions">
            <button class="locate-btn" title="在地图上定位">
              📍
            </button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useDataStore }  from '@/stores/dataStore';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 修复 Leaflet 默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default {
  name: 'HomeView',
  setup() {
    const dataStore = useDataStore();
    const search    = ref('');
    let map = null;
    const markers = {};  // site.id -> L.Marker

    // 初始化地图
    const initMap = () => {
      map = L.map('map-container').setView([50.83, 12.92], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
    };

    // 更新地图标记
    const updateMarkers = () => {
      // 清除旧标记
      Object.values(markers).forEach(marker => {
        map.removeLayer(marker);
      });
      
      // 添加新标记
      dataStore.sites.forEach(site => {
        const marker = L.marker([site.lat, site.lon]).addTo(map);
        
        // 创建弹窗内容
        const popupContent = `
          <div style="min-width: 250px; max-width: 300px;">
            <h4 style="margin: 0 0 8px 0; color: ${site.color}">
              ${site.name}
            </h4>
            <p style="margin: 4px 0;"><strong>类别:</strong> ${site.category}</p>
            ${site.address ? `<p style="margin: 4px 0;"><strong>地址:</strong> ${site.address}</p>` : ''}
            
            <!-- 显示描述信息 -->
            <p style="margin: 8px 0; font-size: 0.9em; line-height: 1.4;">
              ${site.description || ''}
            </p>
            
            <!-- 根据不同类别显示不同图标和额外信息 -->
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
              ${site.category === 'Theatre' ? `
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.5em;">🎭</span>
                  <span style="font-size: 0.9em;">演出场所</span>
                </div>
              ` : site.category === 'Museum' ? `
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.5em;">🏛️</span>
                  <span style="font-size: 0.9em;">文化展览</span>
                </div>
              ` : site.category === 'Public Art' ? `
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.5em;">🎨</span>
                  <span style="font-size: 0.9em;">公共艺术</span>
                </div>
              ` : site.category === 'Restaurant' ? `
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.5em;">🍽️</span>
                  <span style="font-size: 0.9em;">美食餐厅</span>
                </div>
              ` : ''}
            </div>
            
            <p style="margin: 8px 0 4px 0; font-size: 0.8em; color: #999;">
              OSM ID: ${site.osm_id || 'N/A'}<br/>
              坐标: ${site.lat.toFixed(6)}, ${site.lon.toFixed(6)}
            </p>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        markers[site.id] = marker;
      });
    };

    // 点击分类
    const handleCategoryClick = (category) => {
      dataStore.setCategory(category);
    };

    // 搜索执行
    const onSearch = () => {
      dataStore.setQuery(search.value);
    };

    // 定位并打开对应 id 的弹窗
    const centerAndPopup = (siteId) => {
      console.log('Centering on site:', siteId);
      const site = dataStore.sites.find(s => s.id === siteId);
      if (!site || !map) {
        console.error('Site or map not found');
        return;
      }
      
      const { lat, lon } = site;
      
      // 移动地图视角
      map.setView([lat, lon], 16, { animate: true });
      
      // 延迟打开弹窗
      setTimeout(() => {
        const marker = markers[siteId];
        if (marker) {
          marker.openPopup();
        }
      }, 300);
    };

    // 监听数据变化，更新标记
    watch(() => dataStore.sites, () => {
      if (map) {
        updateMarkers();
      }
    });

    onMounted(async () => {
      // 初始化地图
      initMap();
      
      // 加载数据
      await dataStore.loadCategories();
      await dataStore.loadSites();
      
      // 更新标记
      updateMarkers();
    });

    return {
      dataStore,
      search,
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
  height: 100%;
}

.filter-panel {
  width: 250px;
  padding: 1.5rem;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  overflow-y: auto;
}

.filter-panel h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.filter-panel ul {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
}

.filter-panel li {
  padding: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 4px;
}

.filter-panel li:hover {
  background: #e0e0e0;
}

.filter-panel input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.filter-panel button {
  width: 100%;
  padding: 0.5rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.filter-panel button:hover {
  background: #35a372;
}

.content-panel {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

#map-container {
  border: 1px solid #ddd;
  border-radius: 4px;
}

.results-header {
  margin: 1rem 0 0.5rem 0;
  padding: 0.5rem 0;
  border-bottom: 2px solid #e0e0e0;
}

.results-header h3 {
  margin: 0;
  color: #333;
}

.site-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
}

.site-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
}

.site-item:hover {
  background: #f9f9f9;
}

.site-info {
  flex: 1;
}

.site-name {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  font-weight: 500;
}

.site-details {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.site-category {
  font-weight: 500;
}

.site-address {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.site-actions {
  margin-left: 1rem;
}

.locate-btn {
  padding: 0.5rem;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.locate-btn:hover {
  background: #e0e0e0;
  transform: scale(1.1);
}
</style>