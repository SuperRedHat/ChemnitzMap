<template>
  <div class="home-container">
    
    <aside class="filter-panel">
      <h3>Categories</h3>
      <ul>
        <li
          @click="handleNearbyClick()"
          :style="{ 
            fontWeight: dataStore.filter.nearbyMode ? 'bold' : 'normal',
            color: dataStore.filter.nearbyMode ? '#FF8C00' : '#333'
          }"
        >
          📍 Nearby
        </li>
        <li
          @click="handleTenMinuteClick()"
          :style="{ 
            fontWeight: dataStore.filter.tenMinuteMode ? 'bold' : 'normal',
            color: dataStore.filter.tenMinuteMode ? '#1E90FF' : '#333'
          }"
        >
          🚌 10分钟可达
        </li>
        <li
          v-for="cat in dataStore.categories"
          :key="cat.id"
          :style="{
            color: cat.color,
            fontWeight: (dataStore.filter.category === cat.name) || 
                      (dataStore.filter.nearbyMode && dataStore.filter.category === cat.name) ? 'bold' : 'normal'
          }"
          @click="handleCategoryClick(cat.name)"  
        >
          {{ cat.name }}
        </li>
        <li
          @click="handleCategoryClick('')"      
          :style="{ 
            fontStyle: dataStore.filter.category === '' && !dataStore.filter.nearbyMode ? 'italic' : 'normal' 
          }"
        >
          All
        </li>
      </ul>
      <!-- 当处于 Nearby 模式时显示半径控制 -->
      <div v-if="dataStore.filter.nearbyMode" class="nearby-controls">
        <h4>扫描半径: {{ nearbyRadius }} 米</h4>
        <el-slider 
          v-model="nearbyRadius" 
          :min="100" 
          :max="5000" 
          :step="100"
          :marks="radiusMarks"
          @change="onRadiusChange"
        />
        <!-- 显示当前分类 -->
        <div v-if="dataStore.filter.category" class="current-category">
          当前分类: <strong>{{ dataStore.filter.category }}</strong>
        </div>
      </div>

      <!-- 当处于 10分钟城市模式时显示控制 -->
      <div v-if="dataStore.filter.tenMinuteMode" class="ten-minute-controls">
        <h4>出行时间: {{ travelTime }} 分钟</h4>
        <el-slider 
          v-model="travelTime" 
          :min="5" 
          :max="30" 
          :step="5"
          :marks="timeMarks"
          @change="onTravelTimeChange"
        />
        <div class="transport-info">
          <p>🚶 步行时间: {{ dataStore.filter.walkingTime }}分钟</p>
          <p>🚌 公交时间: {{ Math.max(0, travelTime - dataStore.filter.walkingTime) }}分钟</p>
          <p>📍 可达范围: {{ (reachableDistance / 1000).toFixed(1) }}公里</p>
        </div>
      </div>
      
      <!-- 搜索框在 Nearby 模式或10分钟城市模式下禁用 -->
      <input
        type="text"
        v-model="search"
        placeholder="Search..."
        @keyup.enter="onSearch"
        :disabled="dataStore.filter.nearbyMode || dataStore.filter.tenMinuteMode"
      />
      <button @click="onSearch" :disabled="dataStore.filter.nearbyMode || dataStore.filter.tenMinuteMode">Search</button>
    </aside>

    
    <section class="content-panel">
      <div id="map-container" style="height: 600px; width: 100%;"></div>

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
import { http } from '@/api'; 
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
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
      const orangeIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
        iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

    // 10分钟城市相关
    const travelTime = ref(10);
    const tenMinuteCircle = ref(null);
    const reachableDistance = computed(() => {
      return dataStore.calculateReachableDistance();
    });

    // 时间滑块的标记点
    const timeMarks = {
      5: '5分钟',
      10: '10分钟',
      15: '15分钟',
      20: '20分钟',
      30: '30分钟'
    };

    // 处理10分钟城市点击
    const handleTenMinuteClick = () => {
      if (!navigator.geolocation) {
        ElMessage.warning('浏览器不支持定位功能');
        return;
      }

      if (dataStore.filter.tenMinuteMode) {
        // 关闭10分钟城市模式
        stopTenMinuteMode();
      } else {
        // 开启10分钟城市模式
        startTenMinuteMode();
      }
    };

    // 开启10分钟城市模式
    const startTenMinuteMode = () => {
      // 先清空搜索框
      search.value = '';
      
      // 如果已有位置，直接使用
      if (userLocation.value) {
        dataStore.setTenMinuteMode(true, userLocation.value);
        drawTenMinuteCircle();
        showReachablePlaces();
      } else {
        // 否则获取新位置
        getCurrentLocationForTenMinute();
      }
    };

    // 停止10分钟城市模式
    const stopTenMinuteMode = () => {
      // 停止地图动画
      if (map) {
        map.stop();
      }
      
      dataStore.setTenMinuteMode(false);
      
      // 延迟移除等时圈，等待动画停止
      setTimeout(() => {
        if (tenMinuteCircle.value) {
          try {
            if (map && map.hasLayer(tenMinuteCircle.value)) {
              map.removeLayer(tenMinuteCircle.value);
            }
            tenMinuteCircle.value = null;
          } catch (e) {
            console.error('移除10分钟城市圆形失败:', e);
          }
        }
      }, 50);
    };

    // 获取位置（为10分钟城市模式）
    const getCurrentLocationForTenMinute = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [position.coords.latitude, position.coords.longitude];
          userLocation.value = location;
          
          // 添加或更新用户位置标记
          if (userLocationMarker.value) {
            userLocationMarker.value.setLatLng(location);
          } else {
            const marker = L.marker(location, { icon: orangeIcon })
              .addTo(map)
              .bindPopup('您在这里');
            userLocationMarker.value = marker;
          }
          
          // 移动地图视角
          map.setView(location, 14, { animate: true });
          
          // 设置10分钟城市模式
          dataStore.setTenMinuteMode(true, location);
          drawTenMinuteCircle();
          showReachablePlaces();
        },
        (error) => {
          console.error('获取位置失败:', error);
          ElMessage.error('获取当前位置失败，请检查定位权限');
        }
      );
    };

    // 绘制等时圈
    const drawTenMinuteCircle = () => {
      if (!userLocation.value || !map) return;
      
      // 停止当前动画
      map.stop();
      
      // 安全移除旧的圆形
      if (tenMinuteCircle.value) {
        try {
          if (map.hasLayer(tenMinuteCircle.value)) {
            map.removeLayer(tenMinuteCircle.value);
          }
        } catch (e) {
          console.error('移除旧的10分钟城市圆形失败:', e);
        }
      }
      
      const radius = reachableDistance.value;
      
      // 添加新的圆形
      try {
        tenMinuteCircle.value = L.circle(userLocation.value, {
          radius: radius,
          color: '#1E90FF',
          fillColor: '#1E90FF',
          fillOpacity: 0.15,
          weight: 2,
          dashArray: '5, 5'  // 虚线边框
        }).addTo(map);
        
        // 调整地图视野，不使用动画
        setTimeout(() => {
          map.fitBounds(tenMinuteCircle.value.getBounds(), { animate: false });
        }, 50);
      } catch (e) {
        console.error('创建10分钟城市圆形失败:', e);
      }
    };

    // 显示可达地点信息
    const showReachablePlaces = () => {
      if (!dataStore.filter.tenMinuteMode) return;
      
      const count = dataStore.sites.length;
      
      ElMessage.success({
        message: `${travelTime.value}分钟内可到达 ${count} 个文化地点`,
        duration: 3000,
        offset: 100
      });
    };

    // 出行时间改变时的处理
    const onTravelTimeChange = (value) => {
      dataStore.setMaxTravelTime(value);
      if (tenMinuteCircle.value) {
        drawTenMinuteCircle();
      }
      showReachablePlaces();
    };

    // 创建不同颜色的图标
    const createColoredIcon = (color) => {
      // 根据颜色名称映射到 Leaflet 彩色标记的 URL
      const colorMap = {
        'red': 'red',
        'blue': 'blue', 
        'green': 'green',
        'orange': 'orange',
        'yellow': 'gold',
        'violet': 'violet',
        'grey': 'grey',
        'black': 'black'
      };
      
      const leafletColor = colorMap[color] || 'blue';
      
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

    // 根据十六进制颜色获取最接近的标记颜色
    const getMarkerColorFromHex = (hexColor) => {
      // 移除 # 号
      const hex = hexColor.replace('#', '');
      
      // 颜色映射表
      const colorMappings = {
        '#FF5733': 'red',      // Theatre - 红色
        '#33A1FF': 'blue',     // Museum - 蓝色  
        '#33FF57': 'green',    // Public Art - 绿色
        '#FF33A1': 'violet'    // Restaurant - 紫色
      };
      
      return colorMappings[hexColor] || 'blue';
    };
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
    
    // 获取浏览器定位并移动地图
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        alert('浏览器不支持定位功能');
        return;
      }
      
      // 停止当前所有动画
      map.stop();
      
      // 如果正在其他模式中，先退出
      if (dataStore.filter.nearbyMode) {
        stopNearbyMode();
      }
      if (dataStore.filter.tenMinuteMode) {
        stopTenMinuteMode();
      }
      
      // 等待一帧，确保清理完成
      requestAnimationFrame(() => {
        navigator.geolocation.getCurrentPosition(
          async ({ coords }) => {
            const { latitude, longitude } = coords;

            // 如果之前已有定位标记，先安全地移除它
            if (userLocationMarker.value) {
              try {
                if (map.hasLayer(userLocationMarker.value)) {
                  map.removeLayer(userLocationMarker.value);
                }
                userLocationMarker.value = null;
              } catch (e) {
                console.error('移除旧标记失败:', e);
              }
            }

            // 创建新标记
            const marker = L.marker([latitude, longitude], { icon: orangeIcon })
              .addTo(map)
              .bindPopup('您在这里')
              .openPopup();

            // 保存到 ref
            userLocationMarker.value = marker;
            userLocation.value = [latitude, longitude];

            // 将地图中心移动到当前位置（不使用动画，避免冲突）
            map.setView([latitude, longitude], 14, { animate: false });

            // 保存位置到用户资料
            if (authStore.isAuthenticated) {
              try {
                await http.put('/users/me', {
                  current_lat: latitude,
                  current_lon: longitude
                });
                console.log('位置已保存到用户资料');
                await authStore.fetchCurrentUser();
              } catch (error) {
                console.error('保存位置失败:', error);
              }
            }
          },
          (err) => {
            console.error('获取定位失败', err);
            alert('获取当前位置失败');
          },
          { enableHighAccuracy: true }
        );
      });
    };

    // 初始化地图
    const initMap = () => {
      map = L.map('map-container').setView([50.83, 12.92], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      

      // 添加定位按钮（使用HTML元素）
      if ('geolocation' in navigator) {
        const locationButton = L.control({ position: 'topright' });
        
        locationButton.onAdd = function(map) {
          const button = L.DomUtil.create('button', 'leaflet-bar leaflet-control-custom');
          button.innerHTML = '📍';
          button.title = '获取当前位置';
          button.style.width = '34px';
          button.style.height = '34px';
          button.style.fontSize = '20px';
          button.style.lineHeight = '30px';
          button.style.textAlign = 'center';
          button.style.cursor = 'pointer';
          button.style.backgroundColor = 'white';
          button.style.border = '2px solid rgba(0,0,0,0.2)';
          button.style.borderRadius = '4px';
          
          L.DomEvent.on(button, 'click', function(e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            
            // 添加防抖，避免快速点击
            if (button.disabled) return;
            
            button.disabled = true;
            button.style.opacity = '0.5';
            
            getCurrentLocation();
            
            // 1秒后恢复按钮
            setTimeout(() => {
              button.disabled = false;
              button.style.opacity = '1';
            }, 1000);
          });
          
          return button;
        };
        
        locationButton.addTo(map);
      }
      // 添加图例
      const legend = L.control({ position: 'bottomright' });

      legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.backgroundColor = 'white';
        div.style.padding = '10px';
        div.style.borderRadius = '5px';
        div.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
        
        const categories = [
          { name: 'Theatre', color: '#FF5733', icon: '🎭' },
          { name: 'Museum', color: '#33A1FF', icon: '🏛️' },
          { name: 'Public Art', color: '#33FF57', icon: '🎨' },
          { name: 'Restaurant', color: '#FF33A1', icon: '🍽️' }
        ];
        
        let legendHtml = '<h4 style="margin: 0 0 5px 0">文化地点类别</h4>';
        
        categories.forEach(cat => {
          legendHtml += `
            <div style="margin: 5px 0">
              <span style="color: ${cat.color}; font-size: 1.2em">${cat.icon}</span>
              <span>${cat.name}</span>
            </div>
          `;
        });
        
        div.innerHTML = legendHtml;
        return div;
      };

      legend.addTo(map);
    };



    // 更新地图标记
    const updateMarkers = () => {
      // 清除旧标记
      Object.values(markers).forEach(marker => {
        map.removeLayer(marker);
      });
      
      // 添加新标记
      dataStore.sites.forEach(site => {
        const markerColor = getMarkerColorFromHex(site.color);
        const coloredIcon = createColoredIcon(markerColor);
        
        const marker = L.marker([site.lat, site.lon], { icon: coloredIcon }).addTo(map);
        
        // 如果在 Nearby 模式下，添加特殊样式
        if (dataStore.filter.nearbyMode) {
          marker._icon.classList.add('nearby-marker');
        }
        
        // 如果在10分钟城市模式下，添加特殊样式
        if (dataStore.filter.tenMinuteMode) {
          marker._icon.classList.add('ten-minute-marker');
        }
        
        // 创建弹窗内容
        const isFavorited = favoritesStore.isFavorited(site.id);
        const popupContent = `
          <div style="min-width: 250px; max-width: 300px;">
            <h4 style="margin: 0 0 8px 0; color: ${site.color}">
              ${site.name}
            </h4>
            <p style="margin: 4px 0;"><strong>类别:</strong> ${site.category}</p>
            ${site.address ? `<p style="margin: 4px 0;"><strong>地址:</strong> ${site.address}</p>` : ''}
            
            
            <p style="margin: 8px 0; font-size: 0.9em; line-height: 1.4;">
              ${site.description || ''}
            </p>
            
            
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
      if (dataStore.filter.nearbyMode) {
        dataStore.filter.category = category;
        dataStore.applyFilter();
      } else if (dataStore.filter.tenMinuteMode) {
        // 10分钟模式下不允许切换分类
        ElMessage.warning('请先退出10分钟城市模式');
      } else {
        search.value = '';
        dataStore.setQuery('');
        dataStore.setCategory(category);
      }
    };

    // 搜索执行
    const onSearch = () => {
      dataStore.setQuery(search.value) // 内部会走 applyFilter
    }

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

    // 初始加载
    onMounted(async () => {
      initMap()
      await dataStore.loadCategories()  // 拉分类
      await dataStore.loadAllSites()       // 拉站点
      updateMarkers()
    });

    // 新增的响应式数据
    const nearbyRadius = ref(1000);
    const nearbyCircle = ref(null);
    const watchId = ref(null);
    
    // 半径滑块的标记点
    const radiusMarks = {
      100: '100m',
      500: '500m',
      1000: '1km',
      2000: '2km',
      5000: '5km'
    };

    // 处理 Nearby 点击
    const handleNearbyClick = () => {
      if (!navigator.geolocation) {
        ElMessage.warning('浏览器不支持定位功能');
        return;
      }

      if (dataStore.filter.nearbyMode) {
        // 关闭 Nearby 模式
        stopNearbyMode();
      } else {
        // 开启 Nearby 模式
        startNearbyMode();
      }
    };

    // 开启 Nearby 模式
    const startNearbyMode = () => {
      // 先清空搜索框
      search.value = '';
      
      // 获取当前位置
      if (userLocation.value) {
        // 如果已有位置，直接使用
        dataStore.setNearbyMode(true, userLocation.value);
        drawNearbyCircle();
        scanNearbyPlaces();
      } else {
        // 否则获取新位置
        getCurrentLocationForNearby();
      }

      // 开始监听位置变化
      if ('geolocation' in navigator) {
        watchId.value = navigator.geolocation.watchPosition(
          (position) => {
            const newLocation = [position.coords.latitude, position.coords.longitude];
            userLocation.value = newLocation;
            dataStore.updateUserLocation(newLocation);
            
            // 更新圆形覆盖层
            if (nearbyCircle.value) {
              nearbyCircle.value.setLatLng(newLocation);
            }
            
            // 重新扫描
            scanNearbyPlaces();
          },
          (error) => {
            console.error('位置监听错误:', error);
          },
          { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
        );
      }
    };

    // 停止 Nearby 模式
    const stopNearbyMode = () => {
      // 停止地图动画
      if (map) {
        map.stop();
      }
      
      dataStore.setNearbyMode(false);
      
      // 停止位置监听
      if (watchId.value) {
        navigator.geolocation.clearWatch(watchId.value);
        watchId.value = null;
      }
      
      // 延迟移除圆形覆盖层，等待动画停止
      setTimeout(() => {
        if (nearbyCircle.value) {
          try {
            if (map && map.hasLayer(nearbyCircle.value)) {
              map.removeLayer(nearbyCircle.value);
            }
            nearbyCircle.value = null;
          } catch (e) {
            console.error('移除 Nearby 圆形失败:', e);
          }
        }
      }, 50);
    };

    // 获取位置（专门为 Nearby 模式）
    const getCurrentLocationForNearby = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [position.coords.latitude, position.coords.longitude];
          userLocation.value = location;
          
          // 添加或更新用户位置标记
          if (userLocationMarker.value) {
            userLocationMarker.value.setLatLng(location);
          } else {
            const marker = L.marker(location, { icon: orangeIcon })
              .addTo(map)
              .bindPopup('您在这里');
            userLocationMarker.value = marker;
          }
          
          // 移动地图视角
          map.setView(location, 15, { animate: true });
          
          // 设置 Nearby 模式
          dataStore.setNearbyMode(true, location);
          drawNearbyCircle();
          scanNearbyPlaces();
        },
        (error) => {
          console.error('获取位置失败:', error);
          ElMessage.error('获取当前位置失败，请检查定位权限');
        }
      );
    };

    // 绘制半径圆形
    const drawNearbyCircle = () => {
      if (!userLocation.value || !map) return;
      
      // 安全移除旧的圆形
      if (nearbyCircle.value) {
        try {
          if (map.hasLayer(nearbyCircle.value)) {
            map.removeLayer(nearbyCircle.value);
          }
        } catch (e) {
          console.error('移除旧的 Nearby 圆形失败:', e);
        }
      }
      
      // 添加新的圆形
      try {
        nearbyCircle.value = L.circle(userLocation.value, {
          radius: nearbyRadius.value,
          color: '#FF8C00',
          fillColor: '#FF8C00',
          fillOpacity: 0.1,
          weight: 2
        }).addTo(map);
      } catch (e) {
        console.error('创建 Nearby 圆形失败:', e);
      }
    };

    // 扫描附近地点
    const scanNearbyPlaces = () => {
      if (!dataStore.filter.nearbyMode) return;
      
      const count = dataStore.sites.length;
      const categoryText = dataStore.filter.category ? ` (${dataStore.filter.category})` : '';
      
      ElMessage.success({
        message: `已收集 ${count} 个附近地点${categoryText}`,
        duration: 2000,
        offset: 100
      });
    };

    // 半径改变时的处理
    const onRadiusChange = (value) => {
      dataStore.setNearbyRadius(value);
      if (nearbyCircle.value) {
        nearbyCircle.value.setRadius(value);
      }
      scanNearbyPlaces();
    };

    // 在组件卸载时清理
    onUnmounted(() => {
      stopNearbyMode();
      stopTenMinuteMode();
      
      // 清理用户位置标记
      if (userLocationMarker.value) {
        try {
          if (map && map.hasLayer(userLocationMarker.value)) {
            map.removeLayer(userLocationMarker.value);
          }
        } catch (e) {
          console.error('清理用户位置标记失败:', e);
        }
      }
      
      // 清理所有地点标记
      Object.values(markers).forEach(marker => {
        try {
          if (map && map.hasLayer(marker)) {
            map.removeLayer(marker);
          }
        } catch (e) {
          console.error('清理地点标记失败:', e);
        }
      });
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
      viewDetails,
      getCurrentLocation,
      nearbyRadius,
      radiusMarks,
      handleNearbyClick,
      onRadiusChange,
      travelTime,
      timeMarks,
      reachableDistance,
      handleTenMinuteClick,
      onTravelTimeChange
    };
  }
};
</script>

<style scoped>
.ten-minute-controls {
  margin: 1rem 0;
  padding: 1rem;
  background: #e3f2fd;
  border-radius: 4px;
  border: 1px solid #90caf9;
}

.ten-minute-controls h4 {
  margin: 0 0 0.5rem 0;
  color: #1E90FF;
  font-size: 0.9rem;
}

.transport-info {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #666;
}

.transport-info p {
  margin: 0.3rem 0;
}

/* 10分钟模式下的地点标记样式 */
:deep(.ten-minute-marker) {
  filter: drop-shadow(0 0 6px #1E90FF);
}

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

.nearby-controls {
  margin: 1rem 0;
  padding: 1rem;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.nearby-controls h4 {
  margin: 0 0 0.5rem 0;
  color: #FF8C00;
  font-size: 0.9rem;
}

/* 高亮 Nearby 模式下的标记 */
:deep(.nearby-marker) {
  filter: drop-shadow(0 0 6px #FF8C00);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    filter: drop-shadow(0 0 6px #FF8C00);
  }
  50% {
    filter: drop-shadow(0 0 12px #FF8C00);
  }
  100% {
    filter: drop-shadow(0 0 6px #FF8C00);
  }
}

/* 禁用状态的样式 */
.filter-panel input:disabled,
.filter-panel button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-category {
  margin-top: 10px;
  font-size: 0.9rem;
  color: #666;
}

.current-category strong {
  color: #FF8C00;
}
</style>