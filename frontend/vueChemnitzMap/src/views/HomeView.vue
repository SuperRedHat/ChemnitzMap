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
          class="site-item"
        >
          <div class="site-info" @click="() => centerAndPopup(site.id)">
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
            <el-button
              v-if="authStore.isAuthenticated"
              :icon="favoritesStore.isFavorited(site.id) ? 'Star' : 'StarFilled'"
              :type="favoritesStore.isFavorited(site.id) ? 'warning' : 'default'"
              circle
              size="small"
              @click="() => handleFavorite(site.id)"
              :title="favoritesStore.isFavorited(site.id) ? '取消收藏' : '收藏'"
            />
            <el-button
              icon="Location"
              circle
              size="small"
              @click="() => centerAndPopup(site.id)"
              title="在地图上定位"
            />
            <el-button
              icon="View"
              circle
              size="small"
              @click="() => viewDetails(site.id)"
              title="查看详情"
            />
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useDataStore }  from '@/stores/dataStore';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useRouter } from 'vue-router';
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
    const authStore = useAuthStore();
    const favoritesStore = useFavoritesStore();
    const router = useRouter();
    const search = ref('');
    let map = null;
    const markers = {};  // site.id -> L.Marker

    // 用户位置相关
    const userLocation = ref(null);
    const userLocationMarker = ref(null);
    const showNearby = ref(false);
    const nearbyRadius = ref(1000); // 默认1公里

    // 初始化地图
    const initMap = () => {
      map = L.map('map-container').setView([50.83, 12.92], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // 添加定位控件
      if ('geolocation' in navigator) {
        L.control.custom({
          position: 'topright',
          content: '<button class="leaflet-bar leaflet-control-custom" title="获取当前位置">📍</button>',
          classes: '',
          style: {
            margin: '10px',
            cursor: 'pointer'
          },
          events: {
            click: () => {
              getCurrentLocation();
            }
          }
        }).addTo(map);
      }
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
        const isFavorited = favoritesStore.isFavorited(site.id);
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
            
            <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: center;">
              ${authStore.isAuthenticated ? `
                <button onclick="window.handleMapFavorite(${site.id})" 
                  style="padding: 6px 12px; background: ${isFavorited ? '#ffc107' : '#f0f0f0'}; 
                  border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                  ${isFavorited ? '★ 已收藏' : '☆ 收藏'}
                </button>
              ` : ''}
              <button onclick="window.handleMapViewDetails(${site.id})" 
                style="padding: 6px 12px; background: #409eff; color: white; 
                border: none; border-radius: 4px; cursor: pointer;">
                查看详情
              </button>
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

    // 处理收藏
    const handleFavorite = async (siteId) => {
      const result = await favoritesStore.toggleFavorite(siteId);
      if (result.needLogin) {
        router.push('/login');
      } else if (result.success) {
        // 更新地图标记
        updateMarkers();
      }
    };

    // 查看详情
    const viewDetails = (siteId) => {
      router.push(`/site/${siteId}`);
    };

    // 全局函数，供地图弹窗内的按钮调用
    window.handleMapFavorite = handleFavorite;
    window.handleMapViewDetails = viewDetails;

    // 监听数据变化，更新标记
    watch(() => dataStore.sites, () => {
      if (map) {
        updateMarkers();
      }
    });

    // 监听收藏状态变化
    watch(() => favoritesStore.favoriteSiteIds, () => {
      if (map) {
        updateMarkers();
      }
    }, { deep: true });

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
      authStore,
      favoritesStore,
      search,
      onSearch,
      centerAndPopup,
      handleCategoryClick,
      handleFavorite,
      viewDetails
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
  transition: background 0.2s;
}

.site-item:hover {
  background: #f9f9f9;
}

.site-info {
  flex: 1;
  cursor: pointer;
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
  display: flex;
  gap: 0.5rem;
}
</style>