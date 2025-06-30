<template>
  <div class="site-detail-container" v-loading="loading">
    <el-card v-if="site" class="site-card">
      <template #header>
        <div class="card-header">
          <h2 :style="{ color: site.color }">{{ site.name }}</h2>
          <div class="header-actions">
            <el-button
              v-if="authStore.isAuthenticated"
              :icon="favoritesStore.isFavorited(site.id) ? 'Star' : 'StarFilled'"
              :type="favoritesStore.isFavorited(site.id) ? 'warning' : 'default'"
              @click="handleFavorite"
            >
              {{ favoritesStore.isFavorited(site.id) ? '已收藏' : '收藏' }}
            </el-button>
            <el-button @click="$router.back()">返回</el-button>
          </div>
        </div>
      </template>

      <div class="site-content">
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <div class="info-section">
              <h3>基本信息</h3>
              <div class="info-item">
                <span class="label">类别:</span>
                <el-tag :color="site.color" effect="dark">{{ site.category }}</el-tag>
              </div>
              <div class="info-item" v-if="site.address">
                <span class="label">地址:</span>
                <span>{{ site.address }}</span>
              </div>
              <div class="info-item">
                <span class="label">坐标:</span>
                <span>{{ site.lat.toFixed(6) }}, {{ site.lon.toFixed(6) }}</span>
              </div>
              <div class="info-item" v-if="site.osm_id">
                <span class="label">OSM ID:</span>
                <span>{{ site.osm_id }}</span>
              </div>
            </div>

            <div class="description-section">
              <h3>描述</h3>
              <p>{{ site.description || '暂无描述信息' }}</p>
              
              <!-- 根据类别显示不同的额外信息 -->
              <div class="category-info" v-if="site.category === 'Theatre'">
                <el-divider />
                <div class="icon-info">
                  <span class="icon">🎭</span>
                  <div>
                    <h4>剧院信息</h4>
                    <p>这是一个表演艺术场所，您可以在这里欣赏各种精彩的演出，包括戏剧、音乐会、舞蹈等。</p>
                  </div>
                </div>
              </div>
              
              <div class="category-info" v-else-if="site.category === 'Museum'">
                <el-divider />
                <div class="icon-info">
                  <span class="icon">🏛️</span>
                  <div>
                    <h4>博物馆信息</h4>
                    <p>探索丰富的历史文化收藏，了解艺术、科学和人类文明的精彩故事。</p>
                  </div>
                </div>
              </div>
              
              <div class="category-info" v-else-if="site.category === 'Public Art'">
                <el-divider />
                <div class="icon-info">
                  <span class="icon">🎨</span>
                  <div>
                    <h4>公共艺术信息</h4>
                    <p>这是一件户外艺术作品，展现了城市的创意和文化活力。</p>
                  </div>
                </div>
              </div>
              
              <div class="category-info" v-else-if="site.category === 'Restaurant'">
                <el-divider />
                <div class="icon-info">
                  <span class="icon">🍽️</span>
                  <div>
                    <h4>餐厅信息</h4>
                    <p>品尝美味佳肴，体验当地和国际美食文化。</p>
                  </div>
                </div>
              </div>
            </div>
          </el-col>

          <el-col :xs="24" :md="12">
            <div class="map-section">
              <h3>位置</h3>
              <div id="detail-map" style="height: 400px;"></div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-empty v-else-if="!loading" description="地点不存在" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { http } from '@/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 修复 Leaflet 默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const route = useRoute();
const authStore = useAuthStore();
const favoritesStore = useFavoritesStore();

const loading = ref(true);
const site = ref(null);
let detailMap = null;

// 获取地点详情
const fetchSiteDetail = async () => {
  try {
    const response = await http.get(`/sites/${route.params.id}`);
    site.value = response.data;
    
    // 等待DOM更新后初始化地图
    await nextTick();
    setTimeout(() => {
      initMap();
    }, 100);
  } catch (error) {
    console.error('获取地点详情失败:', error);
  } finally {
    loading.value = false;
  }
};

// 初始化地图
const initMap = () => {
  if (!site.value) return;
  
  // 确保容器存在
  const mapContainer = document.getElementById('detail-map');
  if (!mapContainer) {
    console.error('Map container not found');
    return;
  }

  // 如果地图已存在，先移除
  if (detailMap) {
    detailMap.remove();
  }

  try {
    detailMap = L.map('detail-map').setView([site.value.lat, site.value.lon], 16);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(detailMap);

    // 添加标记
    L.marker([site.value.lat, site.value.lon])
      .addTo(detailMap)
      .bindPopup(site.value.name)
      .openPopup();
  } catch (error) {
    console.error('Error initializing map:', error);
  }
};

// 处理收藏
const handleFavorite = async () => {
  const result = await favoritesStore.toggleFavorite(site.value.id);
  if (result.needLogin) {
    $router.push('/login');
  }
};

onMounted(() => {
  fetchSiteDetail();
});

onUnmounted(() => {
  if (detailMap) {
    detailMap.remove();
  }
});
</script>

<style scoped>
.site-detail-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.site-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-header h2 {
  margin: 0;
  font-size: 1.8rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.site-content {
  padding: 20px 0;
}

.info-section,
.description-section,
.map-section {
  margin-bottom: 30px;
}

.info-section h3,
.description-section h3,
.map-section h3 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 1.2rem;
}

.info-item {
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-item .label {
  font-weight: bold;
  color: #606266;
  min-width: 80px;
}

.description-section p {
  line-height: 1.6;
  color: #606266;
}

.category-info {
  margin-top: 20px;
}

.icon-info {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.icon-info .icon {
  font-size: 3rem;
}

.icon-info h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.icon-info p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}

#detail-map {
  border: 1px solid #ddd;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>