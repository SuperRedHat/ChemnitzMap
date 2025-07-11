<template>
  <div class="home-container">
    <!-- 左侧过滤面板 -->
    <aside class="filter-panel">
      <h3>{{ $t('map.categories') }}</h3>
      <ul>
        <!-- 附近模式 -->
        <li class="special-mode-item nearby-mode" :class="{ active: dataStore.filter.nearbyMode }">
          <div class="mode-content" @click="handleNearbyClick()">
            <span class="mode-icon">📍</span>
            <span class="mode-text">{{ $t('map.nearby') }}</span>
          </div>
          <el-switch
            v-model="dataStore.filter.nearbyMode"
            @change="handleNearbySwitchChange"
            :disabled="dataStore.filter.tenMinuteMode"
            size="small"
            @click.stop
          />
        </li>
        <!-- 10分钟城市模式 -->
        <li class="special-mode-item ten-minute-mode" :class="{ active: dataStore.filter.tenMinuteMode }">
          <div class="mode-content" @click="handleTenMinuteClick()">
            <span class="mode-icon">🚌</span>
            <span class="mode-text">{{ $t('map.tenMinute') }}</span>
          </div>
          <el-switch
            v-model="dataStore.filter.tenMinuteMode"
            @change="handleTenMinuteSwitchChange"
            :disabled="dataStore.filter.nearbyMode"
            size="small"
            @click.stop
          />
        </li>
        <!-- 普通分类 -->
        <li
          v-for="cat in dataStore.categories"
          :key="cat.id"
          :class="{ active: dataStore.filter.category === cat.name && !isSpecialMode }"
          class="category-item"
          @click="handleCategoryClick(cat.name)"
        >
          <div class="category-content">
            <span class="category-icon" :style="{ backgroundColor: cat.color }"></span>
            <span class="category-text">{{ cat.name }}</span>
          </div>
        </li>
        <!-- 全部分类 -->
        <li
          @click="handleCategoryClick('')"
          :class="{ active: !dataStore.filter.category && !isSpecialMode }"
          class="category-item all-category"
        >
          <div class="category-content">
            <span class="category-icon all-icon">🌟</span>
            <span class="category-text">{{ $t('map.all') }}</span>
          </div>
        </li>
      </ul>

      <!-- Nearby 模式控制 -->
      <div v-if="dataStore.filter.nearbyMode" class="mode-controls nearby-controls">
        <h4>{{ $t('map.nearbyRadius', { radius: nearbyRadius }) }}</h4>
        <el-slider 
          v-model="nearbyRadius" 
          :min="100" 
          :max="5000" 
          :step="100"
          :marks="radiusMarks"
          @change="onRadiusChange"
        />
        <div v-if="dataStore.filter.category" class="current-category">
          {{ $t('map.nearbyCategory') }}: <strong>{{ dataStore.filter.category }}</strong>
        </div>
      </div>

      <!-- 10分钟城市模式控制 -->
      <div v-if="dataStore.filter.tenMinuteMode" class="mode-controls ten-minute-controls">
        <h4>{{ $t('map.travelTime', { time: travelTime }) }}</h4>
        <el-slider 
          v-model="travelTime" 
          :min="5" 
          :max="30" 
          :step="5"
          :marks="timeMarks"
          @change="onTravelTimeChange"
        />
        <div class="transport-info">
          <p>🚶 {{ $t('map.transportInfo.walking', { time: dataStore.filter.walkingTime }) }}</p>
          <p>🚌 {{ $t('map.transportInfo.transit', { time: Math.max(0, travelTime - dataStore.filter.walkingTime) }) }}</p>
          <p>📍 {{ $t('map.transportInfo.reachable', { distance: (reachableDistance / 1000).toFixed(1) }) }}</p>
        </div>
      </div>
      
      <!-- 搜索框 -->
      <input
        type="text"
        v-model="search"
        :placeholder="$t('map.search')"
        @keyup.enter="onSearch"
        :disabled="isSpecialMode"
      />
      <button @click="onSearch" :disabled="isSpecialMode">{{ $t('map.searchButton') }}</button>
    </aside>

    <!-- 右侧内容区 -->
    <section class="content-panel">
      <!-- 地图容器 -->
      <div id="map-container" ref="mapContainer"></div>

      <!-- 结果列表 -->
      <div class="results-section">
        <div class="results-header">
          <h3>{{ $t('map.results', { count: dataStore.sites.length }) }}</h3>
        </div>
        
        <div v-if="dataStore.loading" class="loading">{{ $t('map.loading') }}</div>
        <div v-else-if="dataStore.error" class="error">{{ dataStore.error }}</div>
        
        <ul v-else class="site-list">
          <li 
            v-for="site in dataStore.sites" 
            :key="site.id"
            class="site-item"
            @click="centerMapOnSite(site)"
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
              <el-button
                v-if="authStore.isAuthenticated"
                :icon="favoritesStore.isFavorited(site.id) ? 'Star' : 'StarFilled'"
                :type="favoritesStore.isFavorited(site.id) ? 'warning' : 'default'"
                circle
                size="small"
                @click.stop="handleFavorite(site.id)"
                :title="favoritesStore.isFavorited(site.id) ? '取消收藏' : '收藏'"
              />
              <el-button
                icon="View"
                circle
                size="small"
                @click.stop="viewDetails(site.id)"
                title="查看详情"
              />
            </div>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useDataStore } from '@/stores/dataStore';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useFootprintsStore } from '@/stores/footprintsStore';
import { http } from '@/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const footprintsStore = useFootprintsStore();

// 处理附近模式开关变化
const handleNearbySwitchChange = (value) => {
  if (value) {
    startNearbyMode();
  } else {
    stopNearbyMode();
  }
};

// 处理10分钟城市模式开关变化
const handleTenMinuteSwitchChange = (value) => {
  if (value) {
    startTenMinuteMode();
  } else {
    stopTenMinuteMode();
  }
};

// 处理收集地点
const handleCollect = async (siteId, siteName) => {
  try {
    console.log('开始收集地点:', siteId, siteName); // 调试信息
    
    if (!userLocation.value) {
      ElMessage.warning(t('messages.locationRequired'));
      return;
    }
    
    const result = await footprintsStore.collectSite(siteId, siteName, userLocation.value);
    if (result.needLogin) {
      router.push('/login');
    } else if (result.success) {
      // 更新地图标记
      updateMarkers();
    }
  } catch (error) {
    console.error('收集地点失败:', error);
    ElMessage.error('收集失败，请重试');
  }
};

// 判断是否可以收集地点
const canCollectSite = (site) => {
  if (!userLocation.value) return false;
  const distance = dataStore.calculateDistance(
    userLocation.value[0], userLocation.value[1],
    site.lat, site.lon
  );
  return distance <= 400;
};

// 修复 Leaflet 图标
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Store
const dataStore = useDataStore();
const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();
const router = useRouter();

// Refs
const mapContainer = ref(null);
const search = ref('');
const nearbyRadius = ref(1000);
const travelTime = ref(10);

// 地图相关
let map = null;
let markersLayer = null; // 使用图层组管理标记
let userMarker = null;
let rangeCircle = null;

// 用户位置
const userLocation = ref(null);

// 计算属性
const isSpecialMode = computed(() => 
  dataStore.filter.nearbyMode || dataStore.filter.tenMinuteMode
);

const reachableDistance = computed(() => 
  dataStore.calculateReachableDistance()
);

// 标记配置
const radiusMarks = computed(() => ({
  500: t('map.radiusMarks.500m'),
  1000: t('map.radiusMarks.1km'),
  2000: t('map.radiusMarks.2km'),
  5000: t('map.radiusMarks.5km')
}));

const timeMarks = computed(() => ({
  5: t('map.timeMarks.5min'),
  10: t('map.timeMarks.10min'),
  15: t('map.timeMarks.15min'),
  20: t('map.timeMarks.20min'),
  30: t('map.timeMarks.30min')
}));

// 创建彩色图标
const createColoredIcon = (hexColor) => {
  const colorMap = {
    '#FF5733': 'red',
    '#33A1FF': 'blue',
    '#33FF57': 'green',
    '#FF33A1': 'violet',
    '#FF8C00': 'orange'  // 添加橙色映射
  };
  
  const leafletColor = colorMap[hexColor] || 'blue';
  
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${leafletColor}.png`,
    iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${leafletColor}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// 橙色图标（用户位置）
const orangeIcon = createColoredIcon('#FF8C00');

// 初始化地图
const initMap = async () => {
  // 等待容器准备就绪
  await nextTick();
  
  if (!mapContainer.value) return;
  
  // 创建地图
  map = L.map(mapContainer.value, {
    center: [50.83, 12.92],
    zoom: 13,
    zoomControl: true,
    attributionControl: true
  });
  
  // 添加瓦片图层
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
  
  // 创建标记图层组
  markersLayer = L.layerGroup().addTo(map);
  
  // 添加定位控件
  if ('geolocation' in navigator) {
    const LocationControl = L.Control.extend({
      options: { position: 'topright' },
      
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        container.innerHTML = '📍';
        container.title = t('map.getLocation');
        container.style.width = '34px';
        container.style.height = '34px';
        container.style.lineHeight = '30px';
        container.style.fontSize = '20px';
        container.style.textAlign = 'center';
        container.style.backgroundColor = 'white';
        container.style.cursor = 'pointer';
        
        L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation)
          .on(container, 'click', L.DomEvent.preventDefault)
          .on(container, 'click', () => getCurrentLocation());
        
        return container;
      }
    });
    
    map.addControl(new LocationControl());
  }
  
  // 添加图例
  addLegend();
};

// 添加图例
const addLegend = () => {
  const legend = L.control({ position: 'bottomright' });
  
  legend.onAdd = function() {
    const div = L.DomUtil.create('div', 'info legend');
    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';
    div.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
    
    const categories = dataStore.categories;
    let html = `<h4 style="margin: 0 0 5px 0">${t('map.legend.title')}</h4>`;
    
    const iconMap = {
      'Theatre': '🎭',
      'Museum': '🏛️',
      'Public Art': '🎨',
      'Restaurant': '🍽️'
    };
    
    categories.forEach(cat => {
      html += `
        <div style="margin: 5px 0">
          <span style="color: ${cat.color}; font-size: 1.2em">${iconMap[cat.name] || '📍'}</span>
          <span>${cat.name}</span>
        </div>
      `;
    });
    
    div.innerHTML = html;
    return div;
  };
  
  legend.addTo(map);
};

// 获取当前位置
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    ElMessage.warning(t('map.locationNotSupported'));
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      userLocation.value = [latitude, longitude];
      
      // 更新或创建用户标记
      updateUserMarker();
      
      // 移动地图视角
      map.setView(userLocation.value, 14);
      
      // 自动打开用户位置弹窗
      if (userMarker) {
        userMarker.openPopup();
      }
      
      // 保存位置到用户资料
      if (authStore.isAuthenticated) {
        try {
          await http.put('/users/me', {
            current_lat: latitude,
            current_lon: longitude
          });
          await authStore.fetchCurrentUser();
        } catch (error) {
          console.error('保存位置失败:', error);
        }
      }
    },
    (error) => {
      console.error('获取位置失败:', error);
      ElMessage.error('获取当前位置失败，请检查定位权限');
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
};

// 更新用户位置标记
const updateUserMarker = () => {
  if (!userLocation.value || !map) return;
  
  if (userMarker) {
    userMarker.setLatLng(userLocation.value);
  } else {
    userMarker = L.marker(userLocation.value, { 
      icon: orangeIcon,
      zIndexOffset: 1000 // 确保用户标记在最上层
    })
    .addTo(map)
    .bindPopup(t('map.legend.youAreHere'));
  }
};

// 更新地图标记
const updateMarkers = () => {
  if (!map || !markersLayer) return;
  
  // 清空标记图层
  markersLayer.clearLayers();
  
  // 添加新标记
  dataStore.sites.forEach(site => {
    const icon = createColoredIcon(site.color);
    const marker = L.marker([site.lat, site.lon], { icon });
    
    // 创建弹窗内容
    const isFavorited = favoritesStore.isFavorited(site.id);
    const popupContent = createPopupContent(site, isFavorited);
    
    marker.bindPopup(popupContent, {
      maxWidth: 300,
      minWidth: 250
    });
    
    markersLayer.addLayer(marker);
  });
};

// 创建弹窗内容
const createPopupContent = (site, isFavorited) => {
  const categoryIcons = {
    'Theatre': '🎭',
    'Museum': '🏛️',
    'Public Art': '🎨',
    'Restaurant': '🍽️'
  };
  
  // 计算距离
  let distance = null;
  let canCollect = false;
  let isCollected = footprintsStore.isCollected(site.id);
  
  if (userLocation.value) {
    distance = Math.round(dataStore.calculateDistance(
      userLocation.value[0], userLocation.value[1],
      site.lat, site.lon
    ));
    canCollect = distance <= 400;
  }
  
  // 转义单引号和其他特殊字符
  const escapedName = (site.name || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
  
  return `
    <div style="padding: 5px;">
      <h4 style="margin: 0 0 8px 0; color: ${site.color}">${site.name}</h4>
      <p style="margin: 4px 0;"><strong>${t('map.popup.category')}:</strong> ${site.category}</p>
      ${site.address ? `<p style="margin: 4px 0;"><strong>${t('map.popup.address')}:</strong> ${site.address}</p>` : ''}
      ${distance !== null ? `<p style="margin: 4px 0;"><strong>${t('map.popup.distance')}:</strong> ${t('map.popup.meters', { distance })}</p>` : ''}
      <p style="margin: 8px 0; font-size: 0.9em;">${site.description || ''}</p>
      
      <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 1.5em;">${categoryIcons[site.category] || '📍'}</span>
        <span style="font-size: 0.9em;">${site.category}</span>
      </div>
      
      <div style="margin-top: 12px; text-align: center;">
        ${authStore.isAuthenticated ? `
          ${!isCollected ? `
            <button onclick="window.handleMapCollect(${site.id}, '${escapedName}')" 
              style="padding: 6px 12px; margin: 0 4px; background: ${canCollect ? '#67c23a' : '#909399'}; 
              color: white; border: none; border-radius: 4px; cursor: ${canCollect ? 'pointer' : 'not-allowed'};"
              ${!canCollect ? 'disabled' : ''}>
              ${canCollect ? `🎯 ${t('map.popup.collect')}` : `🚫 ${t('map.popup.tooFar')}`}
            </button>
          ` : `
            <div style="padding: 6px 12px; margin: 0 4px; background: #e6f7ff; 
              border: 1px solid #91d5ff; border-radius: 4px; color: #1890ff;">
              ✅ ${t('map.popup.collected')}
            </div>
          `}
          <button onclick="window.handleMapFavorite(${site.id})" 
            style="padding: 6px 12px; margin: 0 4px; background: ${isFavorited ? '#ffc107' : '#f0f0f0'}; 
            border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
            ${isFavorited ? `★ ${t('map.popup.favorited')}` : `☆ ${t('map.popup.favorite')}`}
          </button>
        ` : ''}
        <button onclick="window.handleMapViewDetails(${site.id})" 
          style="padding: 6px 12px; margin: 0 4px; background: #409eff; color: white; 
          border: none; border-radius: 4px; cursor: pointer;">
          ${t('map.popup.viewDetails')}
        </button>
      </div>
    </div>
  `;
};

// 处理分类点击
const handleCategoryClick = (category) => {
  if (dataStore.filter.nearbyMode) {
    dataStore.filter.category = category;
    dataStore.applyFilter();
  } else if (dataStore.filter.tenMinuteMode) {
    ElMessage.warning(t('map.exitMode', { mode: t('map.tenMinute') }));
  } else {
    search.value = '';
    dataStore.setQuery('');
    dataStore.setCategory(category);
  }
};

// 搜索
const onSearch = () => {
  if (!isSpecialMode.value) {
    dataStore.setQuery(search.value);
  }
};

// 处理 Nearby 模式
const handleNearbyClick = () => {
  if (dataStore.filter.nearbyMode) {
    stopNearbyMode();
  } else {
    startNearbyMode();
  }
};

// 开启 Nearby 模式
const startNearbyMode = () => {
  // 先关闭10分钟城市模式
  if (dataStore.filter.tenMinuteMode) {
    stopTenMinuteMode();
  }
  
  search.value = '';
  
  if (!userLocation.value) {
    getCurrentLocation();
    // 等待定位完成后再开启模式
    const checkLocation = setInterval(() => {
      if (userLocation.value) {
        clearInterval(checkLocation);
        dataStore.setNearbyMode(true, userLocation.value);
        drawRangeCircle(nearbyRadius.value, '#FF8C00');
        ElMessage.success(t('messages.nearbyModeOn', { radius: nearbyRadius.value }));
      }
    }, 100);
  } else {
    dataStore.setNearbyMode(true, userLocation.value);
    drawRangeCircle(nearbyRadius.value, '#FF8C00');
    ElMessage.success(t('messages.nearbyModeOn', { radius: nearbyRadius.value }));
  }
};

// 停止 Nearby 模式
const stopNearbyMode = () => {
  dataStore.setNearbyMode(false);
  removeRangeCircle();
};

// 处理10分钟城市模式
const handleTenMinuteClick = () => {
  if (dataStore.filter.tenMinuteMode) {
    stopTenMinuteMode();
  } else {
    startTenMinuteMode();
  }
};

// 开启10分钟城市模式
const startTenMinuteMode = () => {
  // 先关闭 Nearby 模式
  if (dataStore.filter.nearbyMode) {
    stopNearbyMode();
  }
  
  search.value = '';
  
  if (!userLocation.value) {
    getCurrentLocation();
    const checkLocation = setInterval(() => {
      if (userLocation.value) {
        clearInterval(checkLocation);
        dataStore.setTenMinuteMode(true, userLocation.value);
        drawRangeCircle(reachableDistance.value, '#1E90FF');
        ElMessage.success(t('messages.tenMinuteModeOn', { distance: (reachableDistance.value / 1000).toFixed(1) }));
      }
    }, 100);
  } else {
    dataStore.setTenMinuteMode(true, userLocation.value);
    drawRangeCircle(reachableDistance.value, '#1E90FF');
    ElMessage.success(t('messages.tenMinuteModeOn', { distance: (reachableDistance.value / 1000).toFixed(1) }));
  }
};

// 停止10分钟城市模式
const stopTenMinuteMode = () => {
  dataStore.setTenMinuteMode(false);
  removeRangeCircle();
};

// 绘制范围圆
const drawRangeCircle = (radius, color) => {
  if (!userLocation.value || !map) return;
  
  removeRangeCircle();
  
  rangeCircle = L.circle(userLocation.value, {
    radius: radius,
    color: color,
    fillColor: color,
    fillOpacity: 0.15,
    weight: 2,
    dashArray: dataStore.filter.tenMinuteMode ? '5, 5' : null
  }).addTo(map);
  
  // 调整视野
  map.fitBounds(rangeCircle.getBounds());
};

// 移除范围圆
const removeRangeCircle = () => {
  if (rangeCircle && map) {
    map.removeLayer(rangeCircle);
    rangeCircle = null;
  }
};

// 半径改变
const onRadiusChange = (value) => {
  dataStore.setNearbyRadius(value);
  if (rangeCircle) {
    rangeCircle.setRadius(value);
    ElMessage.success(t('messages.radiusUpdated', { radius: value }));
  }
};

// 出行时间改变
const onTravelTimeChange = (value) => {
  dataStore.setMaxTravelTime(value);
  if (rangeCircle) {
    drawRangeCircle(reachableDistance.value, '#1E90FF');
    ElMessage.success(t('messages.travelTimeUpdated', { 
      time: value, 
      distance: (reachableDistance.value / 1000).toFixed(1) 
    }));
  }
};

// 点击站点，地图居中
const centerMapOnSite = (site) => {
  if (!map) return;
  map.setView([site.lat, site.lon], 16);
  
  // 找到对应的标记并打开弹窗
  markersLayer.eachLayer(layer => {
    const latlng = layer.getLatLng();
    if (latlng.lat === site.lat && latlng.lng === site.lon) {
      layer.openPopup();
    }
  });
};

// 处理收藏
const handleFavorite = async (siteId) => {
  const result = await favoritesStore.toggleFavorite(siteId);
  if (result.needLogin) {
    router.push('/login');
  } else if (result.success) {
    updateMarkers();
  }
};

// 查看详情
const viewDetails = (siteId) => {
  router.push(`/site/${siteId}`);
};

// 全局函数
window.handleMapFavorite = handleFavorite;
window.handleMapViewDetails = viewDetails;

// 监听数据变化
watch(() => dataStore.sites, updateMarkers);
watch(() => favoritesStore.favoriteSiteIds, updateMarkers, { deep: true });

// 生命周期
onMounted(async () => {
  await initMap();
  await dataStore.loadCategories();
  await dataStore.loadAllSites();
  updateMarkers();
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

// 全局函数
window.handleMapCollect = handleCollect;
window.handleMapFavorite = handleFavorite;
window.handleMapViewDetails = viewDetails;
</script>

<style scoped>
.home-container {
  display: flex;
  height: 100%;
}

/* 左侧过滤面板 */
.filter-panel {
  width: 280px;
  padding: 1.5rem;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  flex-shrink: 0;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
}

/* 特殊模式样式 */
.special-mode-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: white;
  border: 2px solid transparent;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.special-mode-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.special-mode-item.active.nearby-mode {
  border-color: #FF8C00;
  background: linear-gradient(135deg, #fff5e6 0%, #ffe4b3 100%);
}

.special-mode-item.active.ten-minute-mode {
  border-color: #1E90FF;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.mode-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  flex: 1;
}

.mode-icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
}

.mode-text {
  font-weight: 500;
  color: #2c3e50;
}

/* 普通分类样式 */
.category-item {
  padding: 0;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: white;
  border: 2px solid transparent;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.category-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border-color: #e0e0e0;
}

.category-item.active {
  border-color: #3498db;
  background: linear-gradient(135deg, #ebf3fd 0%, #d1e7ff 100%);
}

.category-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
}

.category-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.all-icon {
  font-size: 1rem;
  width: 16px !important;
  height: 16px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%) !important;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.category-text {
  font-weight: 500;
  color: #2c3e50;
  flex: 1;
}

/* 开关样式覆盖 */
.filter-panel :deep(.el-switch) {
  --el-switch-on-color: #3498db;
  --el-switch-off-color: #dcdfe6;
}

.special-mode-item.nearby-mode :deep(.el-switch) {
  --el-switch-on-color: #FF8C00;
}

.special-mode-item.ten-minute-mode :deep(.el-switch) {
  --el-switch-on-color: #1E90FF;
}

/* 搜索框样式优化 */
.filter-panel input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  background: white;
  transition: all 0.3s ease;
  font-size: 14px;
}

.filter-panel input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.filter-panel input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f5f5f5;
}

.filter-panel button {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;
}

.filter-panel button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

.filter-panel button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .filter-panel {
    width: 100%;
    padding: 1rem;
  }
  
  .special-mode-item,
  .category-item {
    margin-bottom: 0.25rem;
  }
  
  .mode-content,
  .category-content {
    padding: 0.5rem;
  }
}

.filter-panel h3 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
  text-align: center;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #3498db;
}

.filter-panel ul {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
}

.filter-panel li {
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
}

.filter-panel li:hover {
  background: #e0e0e0;
}

.filter-panel li.active {
  background: #ddd;
  font-weight: bold;
}

.filter-panel li.special-mode {
  border: 1px solid transparent;
}

.filter-panel li.special-mode.active {
  border-color: currentColor;
  background: rgba(255, 140, 0, 0.1);
}

.filter-panel li.special-mode:first-child.active {
  /* Nearby 模式激活样式 */
  background: rgba(255, 140, 0, 0.15);
  color: #FF8C00;
}

.filter-panel li.special-mode:nth-child(2).active {
  /* 10分钟城市模式激活样式 */
  background: rgba(30, 144, 255, 0.15);
  color: #1E90FF;
}

.filter-panel input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.filter-panel input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.filter-panel button:hover:not(:disabled) {
  background: #35a372;
}

.filter-panel button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 模式控制面板 */
.mode-controls {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 4px;
}

.nearby-controls {
  background: #fff5e6;
  border: 1px solid #ffd4a3;
}

.ten-minute-controls {
  background: #e3f2fd;
  border: 1px solid #90caf9;
}

.mode-controls h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.nearby-controls h4 {
  color: #FF8C00;
}

.ten-minute-controls h4 {
  color: #1E90FF;
}

.current-category {
  margin-top: 10px;
  font-size: 0.9rem;
  color: #666;
}

.current-category strong {
  color: #FF8C00;
}

.transport-info {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #666;
}

.transport-info p {
  margin: 0.3rem 0;
}

/* 右侧内容区 */
.content-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 地图容器 */
#map-container {
  flex: 1;
  min-height: 50%;
}

/* 结果列表区域 */
.results-section {
  height: 40%;
  display: flex;
  flex-direction: column;
  border-top: 2px solid #ddd;
}

.results-header {
    flex-shrink: 0; /* 标题不收缩 */
    padding: 0.5rem 1rem;
    background: #f9f9f9;
    border-bottom: 1px solid #eee;
}

.results-header h3 {
  margin: 0;
  color: #333;
  font-size: 1rem;
}

.loading, .error {
  padding: 2rem;
  text-align: center;
}

.error {
  color: #f56c6c;
}

/* 站点列表 */
.site-list {
  flex: 1;
  overflow-y: auto; /* 关键：让列表可以滚动 */
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
}

.site-item {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.site-item:hover {
  background: #f5f5f5;
}

.site-info {
  flex: 1;
  min-width: 0;
}

.site-name {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.site-details {
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
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
    margin-top: 0.5rem;
    justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
.site-list::-webkit-scrollbar {
    width: 4px;
  }
  
  .site-list::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .site-list::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.2);
    border-radius: 2px;
  }
  
  .site-list::-webkit-scrollbar-thumb:hover {
    background: rgba(0,0,0,0.4);
  }

  .home-container {
    flex-direction: column;
    height: 100vh; /* 确保全屏高度 */
    overflow: hidden; /* 防止整体页面滚动 */
  }
  
  .filter-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #ddd;
    padding: 1rem;
    max-height: 35vh; /* 稍微增加高度 */
    overflow-y: auto; /* 确保过滤面板可以滚动 */
    flex-shrink: 0; /* 防止收缩 */
  }
  
  .content-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 65vh; /* 剩余高度 */
    overflow: hidden; /* 防止内容溢出 */
  }
  
  #map-container {
    height: 50%; /* 地图占内容区域的50% */
    flex-shrink: 0; /* 防止地图被压缩 */
  }
  
  .results-section {
    height: 50%; /* 列表占内容区域的50% */
    flex-shrink: 0; /* 防止列表区域被压缩 */
    display: flex;
    flex-direction: column;
    overflow: hidden; /* 重要：防止整个区域滚动 */
  }
}

/* Leaflet 覆盖样式 */
:deep(.leaflet-control-custom) {
  box-shadow: 0 1px 5px rgba(0,0,0,0.4);
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 8px;
}

:deep(.leaflet-popup-content) {
  margin: 8px 12px;
}
</style>